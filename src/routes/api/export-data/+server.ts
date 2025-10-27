import { json, type RequestHandler } from "@sveltejs/kit";
import { getUserAllowedRegions } from "$lib/server/pmp";
import {
  getAllRegionsAndDistricts,
  getMonthlyDataForExport,
} from "$lib/data/api";

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check if user is authenticated
    const session = await locals.auth();
    if (!session?.user?.email) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      selectedRegions,
      selectedDistricts,
      format = "csv",
      startMonth = null,
      endMonth = null,
    } = await request.json();

    // Validate user can access requested regions
    const allowedRegionNames = await getUserAllowedRegions(session.user.email);
    const allowedRegionIDs = allowedRegionNames.map((item) => item.id);
    const allRegionsAndDistricts = await getAllRegionsAndDistricts();

    // Check if user has permission for selected regions
    if (allowedRegionIDs.length > 0) {
      const allowedRegions = allRegionsAndDistricts
        .filter((item) => allowedRegionIDs.includes(item.regionID))
        .map((item) => item.regionID);

      const unauthorizedRegions = selectedRegions.filter(
        (regionId: string) => !allowedRegions.includes(regionId),
      );

      if (unauthorizedRegions.length > 0) {
        return json(
          { error: "Access denied for some selected regions" },
          { status: 403 },
        );
      }
    }

    // Collect data for each selected region/district combination
    const exportData = await getMonthlyDataForExport(
      selectedRegions,
      selectedDistricts,
      startMonth,
      endMonth,
    );

    if (format === "json") {
      return json({
        data: exportData,
        timestamp: new Date().toISOString(),
        exportedBy: session.user.email,
      });
    } else {
      // Generate CSV
      const csvHeaders = [
        "Region Name",
        "District Name",
        "Facility Name",
        "Unique Patients",
        "Vaccine Stock",
        "Date",
      ];

      const csvRows = exportData.map((item) => [
        item.regionName || "",
        item.districtName || "",
        item.facilityName || "",
        item.uniquePatients || 0,
        item.vaccineStock || 0,
        item.date || "",
      ]);

      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) =>
          row
            .map((field) =>
              typeof field === "string" && field.includes(",")
                ? `"${field.replace(/"/g, '""')}"`
                : field,
            )
            .join(","),
        ),
      ].join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="rabies-data-export-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    return json({ error: "Failed to export data" }, { status: 500 });
  }
};
