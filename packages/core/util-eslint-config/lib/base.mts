import { typescriptCore } from "./typescript/typescript-core.mts";
import { prettier } from "./formatting/prettier.mts";
import { importOrdering } from "./formatting/import-ordering.mts";
import { jsonConfig } from "./json/json.mts";
import { vitestConfig } from "./testing/vitest.mts";
import turbo from "eslint-config-turbo/flat";
import type { ConfigArray } from "typescript-eslint";

export type { ConfigArray } from "typescript-eslint";

export const baseEslintConfig: ConfigArray = [
  ...typescriptCore,
  ...turbo,
  ...prettier,
  ...jsonConfig,
  ...importOrdering,
  ...vitestConfig,
  {
    ignores: ["**/__generated__/**"],
  },
];
