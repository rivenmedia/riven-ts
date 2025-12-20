import { testFiles } from "../internal/file-types.ts";
import type { ConfigArray } from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";

export const vitestConfig = [
  {
    files: [testFiles],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/no-standalone-expect": "off", // https://github.com/vitest-dev/eslint-plugin-vitest/issues/686
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    languageOptions: {
      globals: vitest.environments.env.globals,
    },
  },
] as const satisfies ConfigArray;
