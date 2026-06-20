import eslint from "@eslint/js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import { defineConfig } from "eslint/config";
import globals from "globals";
import * as tseslint from "typescript-eslint";

import { allowConstantLoopConditions } from "../best-practices/allow-constant-loop-conditions.ts";
import { banDateConstructor } from "../best-practices/ban-date-constructor.ts";
import { noUnusedVariables } from "../best-practices/no-unused-variables.ts";
import { preferMikroOrmCore } from "../best-practices/prefer-mikro-orm-core.ts";
import { jsFiles, svelteFiles, tsFiles } from "../internal/file-types.ts";

export const typescriptCore = defineConfig(
  {
    name: "riven:apply-eslint-recommended-config",
    files: [tsFiles, jsFiles, svelteFiles],
    extends: [eslint.configs.recommended],
  },
  {
    name: "riven:apply-ts-js-language-options",
    files: [tsFiles, jsFiles, svelteFiles],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      sourceType: "module",
    },
  },
  {
    name: "riven:typescript-core",
    files: [tsFiles, jsFiles, svelteFiles],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      noUnusedVariables,
      banDateConstructor,
      preferMikroOrmCore,
      allowConstantLoopConditions,
      importX.typescript,
    ],
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
