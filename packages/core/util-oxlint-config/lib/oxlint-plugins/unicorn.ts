import { defineConfig } from "oxlint";

import { jsFiles, testFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginUnicornConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["unicorn"],
      rules: {
        "unicorn/max-nested-calls": "off",
        "unicorn/no-null": "off",
        "unicorn/no-nested-ternary": "allow", // This just suggests to wrap in parentheses which oxfmt strips away
        "unicorn/no-useless-promise-resolve-reject": "allow", // Conflicts with typescript/require-await
        "unicorn/no-useless-undefined": "allow", // Conflicts with eslint/no-useless-return
        "unicorn/number-literal-case": "allow", // Conflicts with oxfmt which lowercases hex literals
        "unicorn/throw-new-error": "off", // Conflicts with BullMQ's RateLimitError

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "unicorn/no-anonymous-default-export": "off",
        "unicorn/no-array-callback-reference": "off",
        "unicorn/no-array-for-each": "off",
        "unicorn/no-array-method-this-argument": "off",
        "unicorn/no-array-reduce": "off",
        "unicorn/no-unreadable-array-destructuring": "off",
      },
    },
    {
      files: ["vitest.config.ts"],
      rules: {
        "unicorn/prefer-export-from": "off", // Interferes with Knip resolution
      },
    },
    {
      files: [...testFiles],
      plugins: ["unicorn"],
      rules: {
        "unicorn/consistent-function-scoping": "off",
      },
    },
  ],
});
