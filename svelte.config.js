import { readFileSync } from 'fs';
import { version } from 'os';
import { fileURLToPath } from 'url';

// get dashboard version and define it for display in the sidebar
const file = fileURLToPath(new URL("package.json", import.meta.url));
const json = readFileSync(file, "utf8");
const pkg = JSON.parse(json);

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
    version: {
      name: pkg.version,
    },
  },
};

export default config;
