import vitest from "@vitest/eslint-plugin";
import { defineConfig } from "oxlint";

import { testFiles } from "../internal/file-types.ts";

export const oxlintPluginVitestConfig = defineConfig({
  overrides: [
    {
      files: [...testFiles],
      plugins: ["vitest"],
      rules: {
        "vitest/no-standalone-expect": "off",
        "no-empty-pattern": "off",
        "typescript/no-unsafe-return": "off",
        "typescript/no-unsafe-assignment": "off",
        "vitest/no-importing-vitest-globals": "off",
        "vitest/consistent-test-filename": [
          "warn",
          { pattern: ".*\\.spec\\.ts$" },
        ],
        "vitest/prefer-to-be-falsy": "off",
        "vitest/prefer-to-be-truthy": "off",
        "vitest/consistent-test-it": ["error", { fn: "it" }],
        "vitest/require-test-timeout": "off",

        // Rules that will be enabled in the future, but are currently disabled to avoid noise
        "vitest/prefer-importing-vitest-globals": "off", // Currently has issues with importing `it` from custom test context files
        "vitest/prefer-called-times": "off",
        "vitest/require-mock-type-parameters": "off",
        "vitest/prefer-strict-equal": "off",
        "vitest/warn-todo": "off",
        "vitest/prefer-called-with": "off",
        "vitest/prefer-to-be": "off",
        "vitest/require-top-level-describe": "off",
        "vitest/require-to-throw-message": "off",
        "vitest/no-conditional-in-test": "off",
        "vitest/prefer-mock-return-shorthand": "off",
        "vitest/max-expects": "off",
        "vitest/prefer-expect-assertions": "off",
        "vitest/prefer-strict-boolean-matchers": "off",

        // Type-aware rules that are disabled for now, but will be enabled in the future
        "vitest/prefer-called-once": "off",
        "vitest/prefer-expect-resolves": "off",
      },
      env: {
        ...vitest.environments.env.globals,
      },
    },
  ],
  settings: {
    vitest: {
      typecheck: true,
    },
  },
});
