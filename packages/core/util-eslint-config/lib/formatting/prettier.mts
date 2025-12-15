import type { ConfigArray } from "typescript-eslint";

import prettierConfig from "eslint-config-prettier/flat";

export const prettier = [prettierConfig] as const satisfies ConfigArray;
