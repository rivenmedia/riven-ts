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
        "no-inline-comments": "off",
        "new-cap": "off", // Incompatible with class decorators styling
        "no-ternary": "off",
        // "capitalized-comments": [
        //   "warn",
        //   "always",
        //   { ignoreConsecutiveComments: true, ignorePattern: "^empty$" },
        // ],
        "no-eq-null": "off",
        "no-continue": "off",
        "no-void": ["warn", { allowAsStatement: true }],
        "no-await-in-loop": "off",
        "require-await": "off", // Handled by typescript/require-await
        // "no-underscore-dangle": ["warn", { allow: ["__typename"] }],

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "no-magic-numbers": "off",
        "max-lines-per-function": "off",
        "sort-keys": "off",
        "max-lines": "off",
        "max-depth": "off",
        "max-statements": "off",
        "func-style": "off",
        "max-params": "off",
        "no-undefined": "off",
        "init-declarations": "off",
        "object-shorthand": "off",
        "class-methods-use-this": "off",
        "preserve-caught-error": "off",
        "no-useless-rename": "off",
        "default-case": "off",
        complexity: "off",
        "require-unicode-regexp": "off",
        "no-shadow": "off",
        "no-useless-return": "off",
        "arrow-body-style": "off",
        "no-plusplus": "off",
        "no-bitwise": "off",
        "func-names": "off",
        "prefer-arrow-callback": "off",
        "no-implicit-coercion": "off",
        "no-negated-condition": "off",
        "prefer-destructuring": "off",
        "no-lonely-if": "off",
        "prefer-named-capture-group": "off",
        "no-console": "off",
        "no-use-before-define": "off",
        "id-length": "off",
        "capitalized-comments": "off",
        "max-classes-per-file": "off",
        "prefer-exponentiation-operator": "off",
        "no-warning-comments": "off",
        "no-duplicate-imports": "off",
        "no-nested-ternary": "off",
        "no-underscore-dangle": "off",
        curly: "off",
        "no-inner-declarations": "off",

        // Type-aware rules that are disabled for now, but will be enabled in the future
        "prefer-template": "off",
        "prefer-regex-literals": "off",
        "default-param-last": "off",
      },
    },
  ],
});
