import { json, type RequestHandler } from "@sveltejs/kit";
import { getUserAllowedRegions } from "$lib/server/pmp";
import {
  getAllRegionsAndDistricts,
  getPatientAndStockNumbers,
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
    } = await request.json();

    // Validate user can access requested regions
    const allowedRegionNames = await getUserAllowedRegions(session.user.email);
    const allRegionsAndDistricts = await getAllRegionsAndDistricts();

    // Check if user has permission for selected regions
    if (allowedRegionNames.length > 0) {
      const allowedRegionIDs = allRegionsAndDistricts
        .filter((item) => allowedRegionNames.includes(item.regionName))
        .map((item) => item.regionID);

      const unauthorizedRegions = selectedRegions.filter(
        (regionId: string) => !allowedRegionIDs.includes(regionId),
      );

      if (unauthorizedRegions.length > 0) {
        return json(
          { error: "Access denied for some selected regions" },
          { status: 403 },
        );
      }
    }

    // Collect data for each selected region/district combination
    const exportData = [];

    for (const regionId of selectedRegions) {
      const regionDistricts = selectedDistricts[regionId] || [];

      if (regionDistricts.length === 0) {
        // Export entire region
        const data = await getPatientAndStockNumbers(regionId, null);
        exportData.push(
          ...data.map((item) => ({
            ...item,
            exportLevel: "region",
          })),
        );
      } else {
        // Export specific districts
        for (const districtId of regionDistricts) {
          const data = await getPatientAndStockNumbers(regionId, districtId);
          exportData.push(
            ...data.map((item) => ({
              ...item,
              exportLevel: "district",
            })),
          );
        }
      }
    }

    if (format === "json") {
      return json({
        data: exportData,
        timestamp: new Date().toISOString(),
        exportedBy: session.user.email,
      });
    } else {
      // Generate CSV
      const csvHeaders = [
        "Region ID",
        "Region Name",
        "District ID",
        "District Name",
        "Facility ID",
        "Facility Name",
        "Unique Patients",
        "Vaccine Stock",
        "Export Level",
      ];

      const csvRows = exportData.map((item) => [
        item.regionID || "",
        item.regionName || "",
        item.districtID || "",
        item.districtName || "",
        item.facilityID || "",
        item.facilityName || "",
        item.uniquePatients || 0,
        item.vaccineStock || 0,
        item.exportLevel || "",
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
