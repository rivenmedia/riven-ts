import { defineConfig } from "oxlint";

import { coreConfig } from "./core/core.ts";
import { eslintPluginEslintJsonConfig } from "./eslint-plugins/@eslint/json.ts";
import { eslintPluginEslintConfigTurboConfig } from "./eslint-plugins/eslint-plugin-turbo.ts";
import { oxlintPluginImportConfig } from "./oxlint-plugins/import.ts";
import { oxlintPluginVitestConfig } from "./oxlint-plugins/vitest.ts";
import { typescriptCore } from "./typescript/typescript-core.ts";

console.log(("1" as string) == "2");

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
    typescriptCore,
    eslintPluginEslintJsonConfig,
    oxlintPluginVitestConfig,
    oxlintPluginImportConfig,
    eslintPluginEslintConfigTurboConfig,
    coreConfig,
  ],
  // options: {
  //   typeAware: true,
  //   typeCheck: true,
  // },
});
