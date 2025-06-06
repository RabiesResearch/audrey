import { json } from "@sveltejs/kit";
import { fetchMonthlyData } from "$lib/data/liveDB";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async () => {
  try {
    const data = await fetchMonthlyData();
    return json(data);
  } catch (error) {
    console.error("API Error:", error);
    return json({ error: "Failed to fetch monthly data" }, { status: 500 });
  }
};
