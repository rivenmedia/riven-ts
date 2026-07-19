import { defineConfig } from "oxlint";

import {
  entityFiles,
  jsFiles,
  testFiles,
  tsFiles,
} from "../internal/file-types.ts";

export const banDateConstructor = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      excludeFiles: [
        ...testFiles,
        entityFiles, // Database entities use the Date constructor to provide runtime type reflect metadata
      ],
      plugins: ["eslint"],
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
  ],
});
