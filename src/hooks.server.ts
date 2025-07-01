import { handle as authHandle } from "./auth.js";
import { sequence } from "@sveltejs/kit/hooks";
import type { Handle } from "@sveltejs/kit";

const authorizationHandle: Handle = async ({ event, resolve }) => {
  // Allow auth routes to pass through
  if (event.url.pathname.startsWith("/auth/")) {
    return resolve(event);
  }

  // If user is not authenticated and trying to access protected routes,
  // this will be handled by individual page server loads
  return resolve(event);
};

export const handle: Handle = sequence(authHandle, authorizationHandle);
