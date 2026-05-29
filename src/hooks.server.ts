import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import { AUTH_SECRET } from "$env/static/private";
import { isEmailWhitelisted } from "$lib/server/pmp";
import { sequence } from "@sveltejs/kit/hooks";
import { error } from "@sveltejs/kit";
import type { Handle } from "@sveltejs/kit";

const { handle: authHandle } = SvelteKitAuth({
  providers: [Google],
  basePath: "/auth",
  trustHost: true,
  secret: AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 28 * 24 * 60 * 60, // 28 days in seconds
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const isAllowed = await isEmailWhitelisted(user.email);
          if (!isAllowed) {
            return false;
          }
        } catch (error) {
          console.error(
            `Error during whitelist check for ${user.email}:`,
            error,
          );
          return false;
        }
      }
      return true;
    },
  },
});

const whitelistGuard: Handle = async ({ event, resolve }) => {
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

export const handle = sequence(authHandle, whitelistGuard);
