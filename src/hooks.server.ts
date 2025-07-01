import { handle as authHandle } from "./auth.js"
import { sequence } from "@sveltejs/kit/hooks"
import type { Handle } from "@sveltejs/kit"

const authorizationHandle: Handle = async ({ event, resolve }) => {
  // If user is not authenticated and trying to access protected routes,
  // redirect to sign in page
  if (event.url.pathname.startsWith('/dashboard') || event.url.pathname === '/') {
    const session = await event.locals.auth()
    
    if (!session?.user && event.url.pathname !== '/auth/signin') {
      return new Response(null, {
        status: 302,
        headers: {
          location: '/auth/signin'
        }
      })
    }
  }

  return resolve(event)
}

export const handle: Handle = sequence(authHandle, authorizationHandle)