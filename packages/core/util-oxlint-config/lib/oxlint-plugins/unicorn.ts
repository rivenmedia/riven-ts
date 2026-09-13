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
        "unicorn/no-array-callback-reference": "allow", // This naively looks at method names (e.g. .find() and .map()) and returns a lot of false positives
        "unicorn/no-array-method-this-argument": "allow", // This conflicts with MikroORM's methods that are passed entity classes which contain `this`
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
        "unicorn/no-unreadable-array-destructuring": "allow",
      },
    },
  ],
});
