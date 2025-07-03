import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import adapter from "@sveltejs/adapter-netlify";

// get dashboard version and define it for display in the sidebar
const file = fileURLToPath(new URL("package.json", import.meta.url));
const json = readFileSync(file, "utf8");
const pkg = JSON.parse(json);

const config = {
  kit: {
    adapter: adapter(),
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
