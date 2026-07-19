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
      },
      env: {
        ...vitest.environments.env.globals,
      },
    },
  ],
});
