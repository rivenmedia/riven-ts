import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const coreConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      rules: {
        eqeqeq: ["error", "smart"],
        "id-length": [
          "warn",
          {
            exceptions: ["z"],
          },
        ],
      },
    },
  ],
});
