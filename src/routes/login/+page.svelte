<script lang="ts">
  import { signIn } from "@auth/sveltekit/client";
  export const prerender = true;
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard - Login</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="w-full max-w-md">
    <div class="rounded-lg bg-white px-8 py-12 shadow-lg">
      <div class="text-center">
        <h1 class="mb-2 text-3xl font-bold text-gray-900">
          Tanzania Rabies Dashboard
        </h1>
        <p class="mb-8 text-gray-600">
          Access comprehensive rabies surveillance data and vaccine stock
          information for Tanzania
        </p>

        <button
          on:click={() => signIn("google", { callbackUrl: "/" })}
          class="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg class="mr-3 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  </div>
</div>
