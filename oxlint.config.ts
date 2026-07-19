import { baseOxlintConfig } from "@repo/core-util-eslint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["**/**"],
      excludeFiles: ["apps/**", "packages/**"],
      plugins: ["typescript", "import", "unicorn"],
      rules: {
        "typescript/no-unsafe-member-access": "off",
        "typescript/no-unsafe-call": "off",
        "typescript/require-await": "off",
        "typescript/no-confusing-void-expression": "off",
        "typescript/no-redundant-type-constituents": "off",
        "typescript/no-base-to-string": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-type-assertion": "off",
        "typescript/no-unsafe-assignment": "off",
        "typescript/consistent-return": "off",
        "typescript/promise-function-async": "off",
        "unicorn/no-await-expression-member": "off",
        "import/unambiguous": "off",
        "unicorn/prefer-module": "off",
        "typescript/no-var-requires": "off",
        "typescript/no-require-imports": "off",
        "import/no-dynamic-require": "off",
        "unicorn/prefer-ternary": "off",
        "unicorn/prefer-string-replace-all": "off",
        "typescript/consistent-type-definitions": "off",
        "import/no-default-export": "off",
        "turbo/no-undeclared-env-vars": "off",
      },
    },
  ],
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
