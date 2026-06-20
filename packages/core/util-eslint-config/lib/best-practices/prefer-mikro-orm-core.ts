import { defineConfig } from "eslint/config";

import { tsFiles } from "../internal/file-types.ts";

export const preferMikroOrmCore = defineConfig({
  name: "riven:prefer-mikro-orm-core",
  files: [tsFiles],
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
});
