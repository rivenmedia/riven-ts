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

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "unicorn/consistent-assert": "off",
        "unicorn/no-array-reduce": "off",
        "unicorn/switch-case-braces": "off",
        "unicorn/numeric-separators-style": "off",
        "unicorn/no-useless-undefined": "off",
        "unicorn/explicit-length-check": "off",
        "unicorn/no-array-sort": "off",
        "unicorn/prefer-spread": "off",
        "unicorn/prefer-set-has": "off",
        "unicorn/no-array-callback-reference": "off",
        "unicorn/custom-error-definition": "off",
        "unicorn/filename-case": "off",
        "unicorn/no-array-method-this-argument": "off",
        "unicorn/text-encoding-identifier-case": "off",
        "unicorn/no-array-for-each": "off",
        "unicorn/import-style": "off",
        "unicorn/no-nested-ternary": "off",
        "unicorn/no-useless-fallback-in-spread": "off",
        "unicorn/prefer-node-protocol": "off",
        "unicorn/no-unreadable-array-destructuring": "off",
        "unicorn/prefer-string-raw": "off",
        "unicorn/no-anonymous-default-export": "off",
        "unicorn/no-negated-condition": "off",
        "unicorn/no-useless-promise-resolve-reject": "off",
        "unicorn/prefer-array-flat": "off",
        "unicorn/prefer-at": "off",
        "unicorn/throw-new-error": "off",
        "unicorn/prefer-string-slice": "off",
        "unicorn/new-for-builtins": "off",
        "unicorn/catch-error-name": "off",
        "unicorn/no-process-exit": "off",
        "unicorn/prefer-single-call": "off",
        "unicorn/prefer-dom-node-remove": "off",
        "unicorn/prefer-dom-node-append": "off",
        "unicorn/prefer-code-point": "off",
        "unicorn/prefer-string-replace-all": "off",
      },
    },
  ],
});
