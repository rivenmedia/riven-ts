import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const oxlintPluginEslintConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      rules: {
        eqeqeq: ["error", "smart"],
        "id-length": [
          "error",
          {
            exceptions: [
              "a", // Used in sort callbacks
              "b", // Used in sort callbacks
              "i", // Used in loops
              "z", // Allow zod import
              "_", // Used to denote an unused variable
            ],
            checkGeneric: false,
          },
        ],
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
        "no-underscore-dangle": ["warn", { allow: ["__typename"] }],
        "no-nested-ternary": "allow", // Handled by unicorn/no-nested-ternary
        "no-console": ["error", { allow: ["debug"] }],
        "no-plusplus": ["deny", { allowForLoopAfterthoughts: true }],
        "no-negated-condition": "off", // Handled by unicorn/no-negated-condition
        "no-warning-comments": "off",
        "no-undefined": "allow",
        "default-case": "allow", // Conflicts with typescript/switch-exhaustiveness-check
        "no-duplicate-imports": ["deny", { allowSeparateTypeImports: true }],
        "func-style": ["deny", "declaration", { allowArrowFunctions: true }],
        "class-methods-use-this": "allow",

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        complexity: "off",
        "max-classes-per-file": "off",
        "max-depth": "off",
        "max-lines": "off",
        "max-lines-per-function": "off",
        "max-params": "off",
        "max-statements": "off",
        "no-magic-numbers": "off",
        "no-shadow": "off",
        "prefer-named-capture-group": "off",
      },
    },
  ],
});
