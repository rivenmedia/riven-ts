import { tsFiles } from "../internal/file-types.ts";

import type { ConfigArray } from "typescript-eslint";

export const allowConstantLoopConditions = [
  {
    files: [tsFiles],
    rules: {
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: "only-allowed-literals",
        },
      ],
    },
  },
] satisfies ConfigArray;
