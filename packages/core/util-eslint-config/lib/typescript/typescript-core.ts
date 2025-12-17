import * as tseslint from "typescript-eslint";
import { flatConfigs as importX } from "eslint-plugin-import-x";

import globals from "globals";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

export const typescriptCore: tseslint.ConfigArray = [
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  importX.typescript,
  {
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
        }),
      ],
    },
  },
] as const;
