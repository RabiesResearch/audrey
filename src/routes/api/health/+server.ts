import { json, type RequestHandler } from "@sveltejs/kit";
import { getPMPClient } from "$lib/server/pmp";

export const GET: RequestHandler = async () => {
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      pmp: "unknown",
    },
  };

  // Test PMP connection
  try {
    const client = getPMPClient();
    await client.getWhitelist();
    healthCheck.services.pmp = "ok";
  } catch (error) {
    console.error("PMP health check failed:", error);
    healthCheck.services.pmp = "error";
    healthCheck.status = "degraded";
  }

  const status = healthCheck.status === "ok" ? 200 : 503;
  return json(healthCheck, { status });
};
