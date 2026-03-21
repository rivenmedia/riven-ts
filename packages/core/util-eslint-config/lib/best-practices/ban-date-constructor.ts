import { entityFiles, testFiles } from "../internal/file-types.ts";

import type { ConfigArray } from "typescript-eslint";

export const banDateConstructor = [
  {
    ignores: [
      testFiles,
      entityFiles, // Database entities use the Date constructor to provide runtime type reflect metadata
    ],
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
