import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";

import type { Config } from "@sveltejs/kit";
import type { TsConfigJson } from "type-fest";

export default {
  preprocess: [vitePreprocess(), mdsvex()],
  kit: {
    adapter: adapter(),
    alias: {
      $houdini: ".houdini/",
    },
    experimental: {
      remoteFunctions: true,
    },
    typescript: {
      config(config: TsConfigJson) {
        config.extends = "@repo/core-util-typescript-config/base.json";
      },
    },
  },
  extensions: [".svelte", ".svx"],
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
  vitePlugin: {
    inspector: true,
  },
} satisfies Config;
