import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.auth();

  if (session?.user) {
    throw redirect(302, "/dashboard");
  } else {
    throw redirect(302, "/auth/signin");
  }
};
