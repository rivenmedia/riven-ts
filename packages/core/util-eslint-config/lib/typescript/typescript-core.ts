import globals from "globals";
import { defineConfig } from "oxlint";

import { allowConstantLoopConditions } from "../best-practices/allow-constant-loop-conditions.ts";
import { banDateConstructor } from "../best-practices/ban-date-constructor.ts";
import { noUnusedVariables } from "../best-practices/no-unused-variables.ts";
import { preferMikroOrmCore } from "../best-practices/prefer-mikro-orm-core.ts";

export const typescriptCore = defineConfig({
  extends: [
    noUnusedVariables,
    banDateConstructor,
    preferMikroOrmCore,
    allowConstantLoopConditions,
  ],
  env: {
    ...globals.node,
    ...globals.es2024,
  },
  plugins: ["typescript", "import"],
  rules: {
    "typescript/prefer-readonly-parameter-types": "off", // Creates a lot of noise
  },
});
