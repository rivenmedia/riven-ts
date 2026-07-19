import { defineConfig } from "oxlint";

import { allowConstantLoopConditions } from "./best-practices/allow-constant-loop-conditions.ts";
import { banDateConstructor } from "./best-practices/ban-date-constructor.ts";
import { noUnusedVariables } from "./best-practices/no-unused-variables.ts";
import { preferMikroOrmCore } from "./best-practices/prefer-mikro-orm-core.ts";
import { eslintPluginEslintJsonConfig } from "./eslint-plugins/@eslint/json.ts";
import { eslintPluginEslintConfigTurboConfig } from "./eslint-plugins/eslint-plugin-turbo.ts";
import { oxlintPluginEslintConfig } from "./oxlint-plugins/eslint.ts";
import { oxlintPluginImportConfig } from "./oxlint-plugins/import.ts";
import { oxlintPluginOxcConfig } from "./oxlint-plugins/oxc.ts";
import { oxlintPluginTypescriptConfig } from "./oxlint-plugins/typescript.ts";
import { oxlintPluginVitestConfig } from "./oxlint-plugins/vitest.ts";

export const baseOxlintConfig = defineConfig({
  categories: {
    correctness: "error",
    suspicious: "warn",
    pedantic: "warn",
    perf: "warn",
    style: "warn",
    restriction: "warn",
  },
  extends: [
    eslintPluginEslintJsonConfig,
    eslintPluginEslintConfigTurboConfig,
    oxlintPluginVitestConfig,
    oxlintPluginImportConfig,
    oxlintPluginEslintConfig,
    oxlintPluginTypescriptConfig,
    oxlintPluginOxcConfig,
    noUnusedVariables,
    banDateConstructor,
    preferMikroOrmCore,
    allowConstantLoopConditions,
  ],
});
