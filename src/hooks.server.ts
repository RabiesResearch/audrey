import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import { AUTH_SECRET } from "$env/static/private";
import { isEmailWhitelisted } from "$lib/server/pmp";

export const { handle } = SvelteKitAuth({
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
      console.log(process.env.AUTH_GOOGLE_ID);
      console.log(process.env.AUTH_GOOGLE_SECRET);
      if (account?.provider === "google" && user.email) {
        try {
          const isAllowed = await isEmailWhitelisted(user.email);
          if (!isAllowed) {
            console.log(
              `Access denied for email: ${user.email} - not in whitelist`,
            );
            return false;
          }
          console.log(`Access granted for email: ${user.email}`);
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
