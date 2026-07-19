import { baseOxlintConfig } from "@repo/core-util-eslint-config";

import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [baseOxlintConfig],
  ignorePatterns: [".source/", "scripts/"],
  overrides: [
    {
      files: ["components/docker-compose-generator.tsx"],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off",
      },
    },
    {
      files: ["app/**/{page,layout}.tsx", "app/{manifest,sitemap}.ts"],
      plugins: ["import"],
      rules: {
        "import/no-default-export": "off",
        "import/prefer-default-export": "error",
      },
    },
  ],
});
