import turboConfig from "eslint-config-turbo/flat";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import { fileURLToPath } from "node:url";

import { prettier } from "./formatting/prettier.ts";
import { jsonConfig } from "./json/json.ts";
import { vitestConfig } from "./testing/vitest.ts";

const gitignorePath = fileURLToPath(
  new URL("../../../../.gitignore", import.meta.url),
);

export const baseEslintConfig = defineConfig(
  includeIgnoreFile(gitignorePath),
  turboConfig,
  prettier,
  vitestConfig,
  jsonConfig,
  {
    ignores: [
      "**/__generated__/**",
      "**/*.typegen.ts",
      "**/.next/**",
      "**/logs/**",
    ],
  },
);
