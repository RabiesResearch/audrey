import { json, type RequestHandler } from "@sveltejs/kit";
import { Client } from "pg";
import { getUserAllowedRegions } from "$lib/server/pmp";
import {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} from "$env/static/private";

// Database connection configuration
const dbConfig = {
  host: DB_HOST || process.env.DB_HOST,
  port: parseInt(DB_PORT || process.env.DB_PORT || "5432"),
  user: DB_USER || process.env.DB_USER,
  password: DB_PASSWORD || process.env.DB_PASSWORD,
  database: DB_NAME || process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // For AWS RDS
  },
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};

export const GET: RequestHandler = async ({ locals, fetch, url }) => {
  let client: Client | null = null;

  try {
    // Only authenticated users; restrict rows to the user's PMP-allowed regions.
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reference mode: complete region/district list (names/IDs only, no tally
    // data), unaffected by the per-user region filter. Used to build the full
    // geography lookup; safe to expose as it carries no sensitive figures.
    if (url.searchParams.get("scope") === "all") {
      client = new Client(dbConfig);
      await client.connect();
      const refResult = await client.query(`
        SELECT DISTINCT
          region_name,
          tangis_region_id,
          district_council_name,
          tangis_district_council_id
        FROM monthly_tz
        ORDER BY region_name, district_council_name
      `);
      const refData = refResult.rows.map((row) => ({
        region_name: row.region_name || "",
        tangis_region_id: row.tangis_region_id || "",
        district_council_name: row.district_council_name || "",
        tangis_district_council_id: row.tangis_district_council_id || "",
      }));
      return json({ success: true, data: refData, count: refData.length });
    }

    const allowedRegions = await getUserAllowedRegions(session.user.email, fetch);
    const allowedRegionIDs = allowedRegions.map((r) => r.id);
    const hasRegionFilter = allowedRegionIDs.length > 0; // empty = all regions

    // Create PostgreSQL client and connect
    client = new Client(dbConfig);
    await client.connect();

    // Query to fetch monthly data with the same structure as CSV
    const query = `
      SELECT 
        tangis_facility_id,
        region_name,
        tangis_region_id,
        district_council_name,
        tangis_district_council_id,
        facility_name,
        "tally-total_patients"::text as tally_total_patients,
        "tally-total_vials"::text as tally_total_vials,
        "SubmissionDate"::text as submission_date,
        report_full_date,
        "tally-report_month" as tally_report_month
      FROM monthly_tz 
      ${hasRegionFilter ? "WHERE tangis_region_id = ANY($1)" : ""}
      ORDER BY "SubmissionDate" DESC, region_name, district_council_name, facility_name
    `;

    const result = hasRegionFilter
      ? await client.query(query, [allowedRegionIDs])
      : await client.query(query);

    // Transform database results to match CSV structure
    const parsedData = result.rows.map((row) => ({
      tangis_facility_id: row.tangis_facility_id || "",
      region_name: row.region_name || "",
      tangis_region_id: row.tangis_region_id || "",
      district_council_name: row.district_council_name || "",
      tangis_district_council_id: row.tangis_district_council_id || "",
      facility_name: row.facility_name || "",
      tally_total_patients: row.tally_total_patients || "0",
      tally_total_vials: row.tally_total_vials || "0",
      submission_date: row.submission_date || "",
      report_full_date: row.report_full_date || "",
      tally_report_month: row.tally_report_month || "",
    }));

    return json({
      success: true,
      data: parsedData,
      count: parsedData.length,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return json(
      {
        success: false,
        error: `Failed to fetch data from database: ${error instanceof Error ? error.message : "Unknown error"}`,
        data: [],
      },
      { status: 500 },
    );
  } finally {
    // Always close the connection
    if (client) {
      try {
        await client.end();
      } catch (endError) {
        console.error("Error closing database connection:", endError);
      }
    }
  }
};
