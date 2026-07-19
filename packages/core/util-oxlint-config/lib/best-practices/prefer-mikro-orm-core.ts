import { defineConfig } from "oxlint";

import { jsFiles, tsFiles } from "../internal/file-types.ts";

export const preferMikroOrmCore = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      plugins: ["eslint"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                regex:
                  "@mikro-orm/(?!(core|reflection|decorators|seeder|migrations)(?:$|/))",
                message:
                  "Prefer to use @mikro-orm/core over other @mikro-orm packages.",
              },
            ],
          },
        ],
      },
    },
  ],
});
