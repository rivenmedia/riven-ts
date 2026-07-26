import playwright from "eslint-plugin-playwright";
import { defineConfig } from "oxlint";

import { playwrightTestFiles } from "../internal/file-types.ts";

import type { DummyRuleMap, OxlintConfig } from "oxlint";

export const eslintPluginEslintPluginPlaywrightConfig: OxlintConfig =
  defineConfig({
    overrides: [
      {
        files: [...playwrightTestFiles],
        jsPlugins: [
          {
            name: "playwright",
            specifier: import.meta.resolve("eslint-plugin-playwright"),
          },
        ],
        rules: playwright.configs["flat/recommended"].rules as DummyRuleMap,
      },
    ],
  });
