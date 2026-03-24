import type { ConfigArray } from "typescript-eslint";

export const preferMikroOrmCore = [
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "@mikro-orm/(?!(core|reflection|decorators)(?:$|/))",
              message:
                "Prefer to use @mikro-orm/core over other @mikro-orm packages.",
            },
          ],
        },
      ],
    },
  },
] satisfies ConfigArray;
