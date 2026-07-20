import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginEslintConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      rules: {
        eqeqeq: ["error", "smart"],
        // "id-length": [
        //   "warn",
        //   {
        //     exceptions: ["a", "b", "z", "_"],
        //     checkGeneric: false,
        //   },
        // ],
        "sort-imports": "off", // Handled by oxfmt
        "sort-keys": "off", // This can cause issues in TS and isn't completely auto-fixable
        "no-inline-comments": "off",
        "new-cap": "off", // Incompatible with class decorators styling
        "no-ternary": "off",
        "capitalized-comments": [
          "warn",
          "always",
          { ignoreConsecutiveComments: true, ignorePattern: "empty" },
        ],
        "no-eq-null": "allow", // Allows null checks to also check undefined
        "no-continue": "off",
        "no-void": ["warn", { allowAsStatement: true }],
        "no-await-in-loop": "off",
        "require-await": "off", // Handled by typescript/require-await
        // "no-underscore-dangle": ["warn", { allow: ["__typename"] }],
        "no-nested-ternary": "allow", // Handled by unicorn/no-nested-ternary
        "no-console": ["error", { allow: ["debug"] }],
        "no-plusplus": ["deny", { allowForLoopAfterthoughts: true }],
        "no-negated-condition": "off", // Handled by unicorn/no-negated-condition

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "class-methods-use-this": "off",
        complexity: "off",
        "default-case": "off",
        "func-style": "off",
        "init-declarations": "off",
        "id-length": "off",
        "max-lines-per-function": "off",
        "max-params": "off",
        "max-lines": "off",
        "max-depth": "off",
        "max-statements": "off",
        "no-magic-numbers": "off",
        "no-undefined": "off",
        "no-shadow": "off",
        "no-lonely-if": "off",
        "no-use-before-define": "off",
        "max-classes-per-file": "off",
        "no-warning-comments": "off",
        "no-duplicate-imports": "off",
        "no-underscore-dangle": "off",
        "no-inner-declarations": "off",
        "prefer-named-capture-group": "off",
        "require-unicode-regexp": "off",

        // Type-aware rules that are disabled for now, but will be enabled in the future
        "prefer-regex-literals": "off",
        "default-param-last": "off",
      },
    },
  ],
});
