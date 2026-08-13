import { baseOxlintConfig } from "@repo/core-util-oxlint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  overrides: [
    {
      files: ["**/sandboxed-jobs/**/*.processor.ts", "graphql-codegen.ts"],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      files: ["graphql-codegen.ts"],
      rules: {
        "no-template-curly-in-string": "off",
      },
    },
    {
      files: ["**/migrations/Migration*.ts"],
      plugins: ["typescript"],
      rules: {
        "typescript/explicit-member-accessibility": "allow",
        "unicorn/filename-case": "off",
      },
    },
    {
      // Classes injected through the DI container must be imported as values.
      // `import type` is erased under verbatimModuleSyntax, which degrades the
      // decorator metadata Nest resolves constructors from to Object, breaking
      // injection at runtime rather than at build time.
      files: [
        "**/*.module.ts",
        "**/*.resolver.ts",
        "**/*.service.ts",
        "**/services/core/base-service.ts",
      ],
      plugins: ["typescript"],
      rules: {
        "typescript/consistent-type-imports": "off",
      },
    },
  ],
});
