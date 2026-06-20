import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

import { jsFiles, tsFiles } from "./internal/file-types.ts";
import { typescriptCore } from "./typescript/typescript-core.ts";

export const createTypescriptEslintConfig = (dirname: string) =>
  defineConfig(typescriptCore, {
    name: "riven:apply-parser-options-typescript-config",
    files: [tsFiles, jsFiles],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: dirname,
        extraFileExtensions: [".svelte"],
      },
    },
  });
