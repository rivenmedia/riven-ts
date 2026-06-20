import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

import { svelteFiles } from "./internal/file-types.ts";
import { svelteCore } from "./svelte/svelte-core.ts";

import type { Config } from "@sveltejs/kit";

export const createSvelteEslintConfig = (
  dirname: string,
  svelteConfig: Config,
) =>
  defineConfig(svelteCore, {
    name: "riven:apply-parser-options-svelte",
    files: [svelteFiles],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: dirname,
        parser: tseslint.parser,
        projectService: true,
        extraFileExtensions: [".svelte"],
        svelteConfig,
      },
    },
  });
