import eslint from "@eslint/js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import { defineConfig } from "eslint/config";
import globals from "globals";
import * as tseslint from "typescript-eslint";

import { banDateConstructor } from "../best-practices/ban-date-constructor.ts";
import { noUnusedVariables } from "../best-practices/no-unused-variables.ts";
import { jsFiles, tsFiles } from "../internal/file-types.ts";

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
      banDateConstructor,
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
