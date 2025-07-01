<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(async () => {
    // Check if user is authenticated and redirect to dashboard
    const session = await fetch('/auth/session').then(r => r.json());
    if (session?.user) {
      goto('/dashboard');
    } else {
      goto('/auth/signin');
    }
  });
</script>

<svelte:head>
  <title>Tanzania Rabies Dashboard</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900">
      Tanzania Rabies Dashboard
    </h1>
    <p class="mt-2 text-gray-600">Loading...</p>
  </div>
</div>
