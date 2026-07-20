import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

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

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "unicorn/no-array-reduce": "off",
        "unicorn/switch-case-braces": "off",
        "unicorn/no-array-callback-reference": "off",
        "unicorn/custom-error-definition": "off",
        "unicorn/filename-case": "off",
        "unicorn/no-array-method-this-argument": "off",
        "unicorn/text-encoding-identifier-case": "off",
        "unicorn/no-array-for-each": "off",
        "unicorn/import-style": "off",
        "unicorn/no-useless-fallback-in-spread": "off",
        "unicorn/prefer-node-protocol": "off",
        "unicorn/no-unreadable-array-destructuring": "off",
        "unicorn/prefer-string-raw": "off",
        "unicorn/no-anonymous-default-export": "off",
        "unicorn/throw-new-error": "off",
        "unicorn/new-for-builtins": "off",
        "unicorn/no-process-exit": "off",
        "unicorn/prefer-single-call": "off",
        "unicorn/prefer-dom-node-remove": "off",
        "unicorn/prefer-dom-node-append": "off",
        "unicorn/prefer-string-replace-all": "off",

        // Type-aware rules that are disabled for now, but will be enabled in the future
        "unicorn/prefer-number-coercion": "off",
        "unicorn/consistent-function-scoping": "off",
        "unicorn/prefer-native-coercion-functions": "off",
        "unicorn/no-useless-collection-argument": "off",
        "unicorn/no-immediate-mutation": "off",
      },
    },
    {
      files: ["vitest.config.ts"],
      rules: {
        "unicorn/prefer-export-from": "off", // Interferes with Knip resolution
      },
    },
  ],
});
