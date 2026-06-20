import { defineConfig } from "eslint/config";

import {
  entityFiles,
  jsFiles,
  testFiles,
  tsFiles,
} from "../internal/file-types.ts";

export const banDateConstructor = defineConfig({
  name: "riven:ban-date-constructor",
  files: [jsFiles, tsFiles],
  ignores: [
    ...testFiles,
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
});
