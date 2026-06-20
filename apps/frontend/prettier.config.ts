import { mergeWith } from "es-toolkit";

import baseConfig from "../../prettier.config.ts";

import type { Config } from "prettier";

export default mergeWith<Config, Config>(
  baseConfig,
  {
    plugins: [
      import.meta.resolve("prettier-plugin-svelte"),
      import.meta.resolve("prettier-plugin-tailwindcss"),
    ],
    overrides: [
      {
        files: "*.svelte",
        options: {
          parser: "svelte",
          svelteIndentScriptAndStyle: true,
          svelteSortOrder: "scripts-markup-styles-options",
          svelteAllowShorthand: true,
        },
      },
      {
        files: "*.md",
        options: {
          printWidth: 70,
        },
      },
      {
        files: "*.html",
        options: {
          parser: "html",
          htmlWhitespaceSensitivity: "ignore",
        },
      },
    ],
  },
  (targetValue: unknown, sourceValue: unknown): unknown => {
    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      return targetValue.concat(sourceValue);
    }

    return undefined;
  },
) satisfies Config;
