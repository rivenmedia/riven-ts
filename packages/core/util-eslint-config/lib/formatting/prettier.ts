import prettierConfig from "eslint-config-prettier/flat";

import type { ConfigArray } from "typescript-eslint";

export const prettier = [prettierConfig] as const satisfies ConfigArray;
