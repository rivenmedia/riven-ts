import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: adapter(),
    alias: {
      $components: "src/lib/components",
      $graphql: "src/lib/graphql",
    },
  },
};

export default config;
