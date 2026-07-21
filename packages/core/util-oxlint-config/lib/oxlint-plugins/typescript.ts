import globals from "globals";
import { defineConfig } from "oxlint";

import {
  jsFiles,
  testFiles,
  tsFiles,
  tsDefinitionFiles,
} from "../internal/file-types.ts";

export const oxlintPluginTypescriptConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/ban-types": "off",
        "typescript/prefer-optional-chain": "deny",
        "typescript/no-extraneous-class": [
          "deny",
          { allowWithDecorator: true },
        ],
        "typescript/explicit-module-boundary-types": "allow", // This enforces every *exported* function to have a return type, which is incompatible with inferred types
        "typescript/explicit-function-return-type": "allow", // This enforces every function to have a return type, which is incompatible with inferred types
        "typescript/consistent-return": "allow", // TypeScript's `noImplicitReturns` compiler option already enforces a better version of this rule
        "typescript/no-unsafe-type-assertion": "allow", // This is incompatible with XState's method of inferring types (e.g. {} as Context)
        "typescript/prefer-readonly-parameter-types": "off", // This rule just plays havoc everywhere and seems to expect all external dependencies to conform to it...

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "typescript/strict-boolean-expressions": "off",
      },
      env: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    {
      files: [tsDefinitionFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/no-empty-interface": ["deny", { allowSingleExtends: true }], // Allow empty interfaces in definition files, as they are often used for type augmentation
        "typescript/no-empty-object-type": [
          "deny",
          { allowInterfaces: "always" },
        ],
      },
    },
    {
      files: [...testFiles],
      plugins: ["typescript"],
      rules: {
        "typescript/no-unsafe-argument": "allow", // Allow the use of helpers such as expect.objectContaining() which return `any`
        "typescript/strict-void-return": [
          "deny",
          {
            allowReturnAny: true, // Allow mocks to return `any` in test files
          },
        ],
        "typescript/prefer-readonly-parameter-types": "allow",
      },
    },
  ],
});
