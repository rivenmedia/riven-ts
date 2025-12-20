import { typescriptCore } from "./typescript/typescript-core.ts";
import { prettier } from "./formatting/prettier.ts";
import { importOrdering } from "./formatting/import-ordering.ts";
import { jsonConfig } from "./json/json.ts";
import { vitestConfig } from "./testing/vitest.ts";
import turboConfig from "eslint-config-turbo/flat";
import type { ConfigArray } from "typescript-eslint";

export type { ConfigArray } from "typescript-eslint";

export const baseEslintConfig: ConfigArray = [
  ...typescriptCore,
  ...turboConfig,
  ...prettier,
  ...jsonConfig,
  ...importOrdering,
  ...vitestConfig,
  {
    ignores: ["**/__generated__/**", "**/.next/**"],
  },
];
