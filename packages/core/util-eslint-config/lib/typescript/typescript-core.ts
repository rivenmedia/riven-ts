import { noUnusedVariables } from "../best-practices/no-unused-variables.ts";
import { jsFiles, tsFiles } from "../internal/file-types.ts";
import * as tseslint from "typescript-eslint";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";

import globals from "globals";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

export const typescriptCore = defineConfig(
  {
    files: [tsFiles, jsFiles],
    extends: [eslint.configs.recommended],
  },
  {
    files: [tsFiles],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      noUnusedVariables,
      importX.typescript as never,
    ],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          tsconfig: {
            references: "auto",
            configFile: "tsconfig.json",
          },
        }),
      ],
    },
  },
);
