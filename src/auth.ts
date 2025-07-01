import { SvelteKitAuth } from "@auth/sveltekit"
import Google from "@auth/sveltekit/providers/google"
import { env } from "$env/static/private"

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 28 * 24 * 60 * 60, // 28 days in seconds
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth account & profile info in the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token
        token.profile = profile
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken
      session.user = token.profile || session.user
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
})