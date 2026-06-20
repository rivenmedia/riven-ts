import eslint from "@eslint/js";
import { flatConfigs as importX } from "eslint-plugin-import-x";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import globals from "globals";
import * as tseslint from "typescript-eslint";

import { allowConstantLoopConditions } from "../best-practices/allow-constant-loop-conditions.ts";
import { banDateConstructor } from "../best-practices/ban-date-constructor.ts";
import { noUnusedVariables } from "../best-practices/no-unused-variables.ts";
import { preferMikroOrmCore } from "../best-practices/prefer-mikro-orm-core.ts";
import { svelteFiles } from "../internal/file-types.ts";

export const svelteCore = defineConfig(
  {
    name: "riven:apply-svelte-recommended-config",
    files: [svelteFiles],
    extends: [eslint.configs.recommended],
  },
  {
    name: "riven:apply-repository-linting-rules",
    files: [svelteFiles],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      noUnusedVariables,
      banDateConstructor,
      preferMikroOrmCore,
      allowConstantLoopConditions,
      importX.typescript,
    ],
  },
  {
    name: "riven:apply-svelte-language-config",
    files: [svelteFiles],
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    name: "riven:apply-svelte-prettier-config",
    files: [svelteFiles],
    extends: svelte.configs.prettier,
  },
);
