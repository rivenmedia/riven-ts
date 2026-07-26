import { defineConfig } from "oxlint";

import { allowConstantLoopConditions } from "./best-practices/allow-constant-loop-conditions.ts";
import { banDateConstructor } from "./best-practices/ban-date-constructor.ts";
import { noUnusedVariables } from "./best-practices/no-unused-variables.ts";
import { preferMikroOrmCore } from "./best-practices/prefer-mikro-orm-core.ts";
import { eslintPluginEslintJsonConfig } from "./eslint-plugins/@eslint/json.ts";
import { eslintPluginEslintPluginPlaywrightConfig } from "./eslint-plugins/eslint-plugin-playwright.ts";
import { eslintPluginEslintPluginReactHooksConfig } from "./eslint-plugins/eslint-plugin-react-hooks.ts";
import { eslintPluginEslintPluginStorybookConfig } from "./eslint-plugins/eslint-plugin-storybook.ts";
import { eslintPluginEslintPluginTurboConfig } from "./eslint-plugins/eslint-plugin-turbo.ts";
import { oxlintPluginEslintConfig } from "./oxlint-plugins/eslint.ts";
import { oxlintPluginImportConfig } from "./oxlint-plugins/import.ts";
import { oxlintPluginJsxA11yConfig } from "./oxlint-plugins/jsx-a11y.ts";
import { oxlintPluginNextJSConfig } from "./oxlint-plugins/nextjs.ts";
import { oxlintPluginNodeConfig } from "./oxlint-plugins/node.ts";
import { oxlintPluginOxcConfig } from "./oxlint-plugins/oxc.ts";
import { oxlintPluginReactConfig } from "./oxlint-plugins/react.ts";
import { oxlintPluginTypescriptConfig } from "./oxlint-plugins/typescript.ts";
import { oxlintPluginUnicornConfig } from "./oxlint-plugins/unicorn.ts";
import { oxlintPluginVitestConfig } from "./oxlint-plugins/vitest.ts";

export const baseOxlintConfig = defineConfig({
  categories: {
    correctness: "error",
    suspicious: "error",
    pedantic: "error",
    perf: "error",
    style: "error",
    restriction: "error",
  },
  extends: [
    eslintPluginEslintJsonConfig,
    eslintPluginEslintPluginTurboConfig,
    eslintPluginEslintPluginPlaywrightConfig,
    eslintPluginEslintPluginReactHooksConfig,
    eslintPluginEslintPluginStorybookConfig,
    oxlintPluginVitestConfig,
    oxlintPluginImportConfig,
    oxlintPluginEslintConfig,
    oxlintPluginTypescriptConfig,
    oxlintPluginOxcConfig,
    oxlintPluginUnicornConfig,
    oxlintPluginReactConfig,
    oxlintPluginNodeConfig,
    oxlintPluginJsxA11yConfig,
    oxlintPluginNextJSConfig,
    noUnusedVariables,
    banDateConstructor,
    preferMikroOrmCore,
    allowConstantLoopConditions,
  ],
});
