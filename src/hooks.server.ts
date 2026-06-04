import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import { AUTH_SECRET } from "$env/static/private";
import { isEmailWhitelisted } from "$lib/server/pmp";
import { sequence } from "@sveltejs/kit/hooks";
import { whitelistGuard } from "$lib/server/whitelist-guard";

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

export const handle = sequence(authHandle, whitelistGuard);
