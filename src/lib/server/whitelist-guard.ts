import { error, type Handle } from "@sveltejs/kit";
import { isEmailWhitelisted } from "./pmp";

// Per-request guard: re-checks the PMP whitelist on every request (not just at
// sign-in) so access revoked in PMP takes effect without waiting for the
// session to expire. The login/auth routes are exempt so a denied user can
// still reach the sign-in screen.
export const whitelistGuard: Handle = async ({ event, resolve }) => {
  if (
    event.url.pathname.startsWith("/auth") ||
    event.url.pathname === "/login"
  ) {
    return resolve(event);
  }

  const session = await event.locals.auth();
  if (session?.user?.email) {
    const isAllowed = await isEmailWhitelisted(session.user.email);
    if (!isAllowed) {
      throw error(
        403,
        "Your account is not authorised to access this dashboard. Please contact your administrator to request access.",
      );
    }
  }

  return resolve(event);
};
