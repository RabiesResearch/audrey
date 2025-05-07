/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // TODO adapter: adapter(),
    alias: {
      $components: "src/lib/components",
      $utils: "src/lib/utils",
      $data: "src/lib/data",
    },
  },
};

export default config;
