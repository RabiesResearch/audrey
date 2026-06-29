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
      const [lng, lat] = point;
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
