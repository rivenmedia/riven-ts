import turboConfig from "eslint-config-turbo/flat";
import type { ConfigArray } from "typescript-eslint";

import { prettier } from "./formatting/prettier.ts";
import { jsonConfig } from "./json/json.ts";
import { vitestConfig } from "./testing/vitest.ts";
import { typescriptCore } from "./typescript/typescript-core.ts";

export type { ConfigArray } from "typescript-eslint";

export const baseEslintConfig: ConfigArray = [
  ...typescriptCore,
  ...turboConfig,
  ...prettier,
  ...jsonConfig,
  ...vitestConfig,
  {
    ignores: ["**/__generated__/**", "**/*.typegen.ts", "**/.next/**"],
  },
];
