import { json, type RequestHandler } from "@sveltejs/kit";
import { Client } from "pg";
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} from "$env/static/private";
import { getUserAllowedRegions } from "$lib/server/pmp";
import wardPointsRaw from "$lib/server/data/ward-points.json";

// tangis_ward_id → [lng, lat] ward centroid, derived from tan-gis wards_master_2022.csv.
const wardPoints = wardPointsRaw as Record<string, number[]>;

const dbConfig = {
  host: DB_HOST || process.env.DB_HOST,
  port: parseInt(DB_PORT || process.env.DB_PORT || "5432"),
  user: DB_USER || process.env.DB_USER,
  password: DB_PASSWORD || process.env.DB_PASSWORD,
  database: DB_NAME || process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};

const EMPTY_HIGH_RISK_BITES_DATA = {
  wards: [],
  districtPoints: [],
  regionTotals: {},
  districtTotals: {},
};

// Seeding the jitter by ward_id collapses a ward's cases to one point, so markers
// can't be averaged back to the ward/village.
const JITTER_RADIUS_KM = 7;
const KM_PER_DEG_LAT = 111;

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function jitter(lng: number, lat: number, seed: number): [number, number] {
  const rng = mulberry32(seed);
  const angle = rng() * 2 * Math.PI;
  // sqrt keeps the distribution uniform across the disc (not clustered at the centre).
  const distKm = Math.sqrt(rng()) * JITTER_RADIUS_KM;
  const dLat = (distKm * Math.cos(angle)) / KM_PER_DEG_LAT;
  const dLng =
    (distKm * Math.sin(angle)) /
    (KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

export const GET: RequestHandler = async ({ locals, fetch }) => {
  const session = await locals.auth();
  if (!session?.user?.email) {
    return json(
      {
        success: false,
        error: "Unauthorized",
        data: EMPTY_HIGH_RISK_BITES_DATA,
      },
      { status: 401 },
    );
  }

  // DEV-empty = unrestricted, prod-empty = fail-closed (mirrors /api/health-facilities).
  const allowedRegions = await getUserAllowedRegions(session.user.email, fetch);
  const allowedRegionIDs = allowedRegions.map((r) => r.id);
  const regionFilter =
    import.meta.env.DEV && allowedRegionIDs.length === 0
      ? null
      : allowedRegionIDs;

  if (regionFilter !== null && regionFilter.length === 0) {
    return json({
      success: true,
      data: EMPTY_HIGH_RISK_BITES_DATA,
    });
  }

  let client: Client | null = null;
  try {
    client = new Client(dbConfig);
    await client.connect();

    const params: unknown[] = [];
    let regionClause = "";
    if (regionFilter !== null) {
      params.push(regionFilter);
      regionClause = `AND tangis_region_id = ANY($1)`;
    }

    // Ward-null rows are kept: they still count toward the totals, just get no marker.
    const query = `
      SELECT tangis_ward_id, tangis_region_id, tangis_district_council_id
      FROM psanon_human_tz
      WHERE risk_level = 'high'
        AND tangis_region_id IS NOT NULL
        ${regionClause}
    `;
    const result = await client.query(query, params);

    const regionTotals: Record<string, number> = {};
    const districtTotals: Record<string, number> = {};
    const seenWards = new Set<string>();
    const wards: Array<{ lat: number; lng: number; regionId: string }> = [];
    const districtAgg: Record<
      string,
      { lngSum: number; latSum: number; n: number; regionId: string }
    > = {};

    for (const row of result.rows) {
      const regionId = row.tangis_region_id as string;
      regionTotals[regionId] = (regionTotals[regionId] ?? 0) + 1;

      const districtId = row.tangis_district_council_id as string | null;
      if (districtId) {
        districtTotals[districtId] = (districtTotals[districtId] ?? 0) + 1;
      }

      const wardId = row.tangis_ward_id as string | null;
      if (!wardId || seenWards.has(wardId)) continue;
      seenWards.add(wardId);
      const point = wardPoints[wardId];
      if (!point) continue;
      const [lng, lat] = jitter(point[0], point[1], hashString(wardId));
      wards.push({ lat, lng, regionId });

      if (districtId) {
        const agg = (districtAgg[districtId] ??= {
          lngSum: 0,
          latSum: 0,
          n: 0,
          regionId,
        });
        agg.lngSum += lng;
        agg.latSum += lat;
        agg.n += 1;
      }
    }

    const districtPoints = Object.entries(districtAgg).map(
      ([districtId, a]) => ({
        districtId,
        regionId: a.regionId,
        lat: a.latSum / a.n,
        lng: a.lngSum / a.n,
      }),
    );

    return json({
      success: true,
      data: { wards, districtPoints, regionTotals, districtTotals },
    });
  } catch (error) {
    console.error("Failed to fetch high-risk bites:", error);
    return json(
      {
        success: false,
        error: `Failed to fetch high-risk bites: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: EMPTY_HIGH_RISK_BITES_DATA,
      },
      { status: 500 },
    );
  } finally {
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error("Error closing database connection:", endError);
      }
    }
  }
};
