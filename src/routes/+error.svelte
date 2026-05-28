<script lang="ts">
  import { page } from "$app/stores";
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard - {$page.status}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="w-full max-w-md">
    <div class="rounded-lg bg-white px-8 py-12 shadow-lg text-center">
      {#if $page.status === 403}
        <h1 class="mb-2 text-3xl font-bold text-gray-900">Access Denied</h1>
        <p class="mb-8 text-gray-600">
          Your account is not authorised to access this dashboard. Please
          contact your administrator to request access.
        </p>
      {:else}
        <h1 class="mb-2 text-3xl font-bold text-gray-900">
          {$page.status} — Something went wrong
        </h1>
        <p class="mb-8 text-gray-600">{$page.error?.message ?? "An unexpected error occurred."}</p>
      {/if}

      <a
        href="/login"
        class="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      >
        Back to login
      </a>
    </div>
  </div>
</div>
