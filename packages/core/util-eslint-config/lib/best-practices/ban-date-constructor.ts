import type { ConfigArray } from "typescript-eslint";

export const banDateConstructor = [
  {
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "Date",
          message: "Prefer to use Luxon's DateTime instead.",
        },
      ],
    },
  },
] satisfies ConfigArray;
