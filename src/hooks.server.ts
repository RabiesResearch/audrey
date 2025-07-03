import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import {
  AUTH_SECRET,
  AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET,
} from "$lib/server/env";

export const { handle } = SvelteKitAuth({
  providers: [
    Google({
      clientId: AUTH_GOOGLE_ID,
      clientSecret: AUTH_GOOGLE_SECRET,
    }),
  ],
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
});
