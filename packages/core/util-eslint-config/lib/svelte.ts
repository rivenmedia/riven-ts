import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

import { svelteFiles } from "./internal/file-types.ts";
import { svelteCore } from "./svelte/svelte-core.ts";

import type { Config } from "@sveltejs/kit";

export const createSvelteEslintConfig = (svelteConfig: Config) =>
  defineConfig(svelteCore, {
    name: "riven:apply-parser-options-svelte-config",
    files: [svelteFiles],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        extraFileExtensions: [".svelte"],
        svelteConfig,
      },
    },
  });
