import { defineConfig } from "oxlint";

import { tsFiles, jsFiles } from "../../internal/file-types.ts";

function paddedLineAround(statementType: string | string[]) {
  return [
    { blankLine: "always", prev: statementType, next: "*" },
    { blankLine: "always", prev: "*", next: statementType },
  ];
}

export const eslintPluginStylisticEslintPluginConfig = defineConfig({
  overrides: [
    {
      files: [tsFiles, jsFiles],
      jsPlugins: [
        {
          name: "@stylistic",
          specifier: import.meta.resolve("@stylistic/eslint-plugin"),
        },
      ],
      rules: {
        "@stylistic/padding-line-between-statements": [
          "error",
          ...paddedLineAround([
            "block-like",
            "return",
            "interface",
            "type",
            "export",
            "const",
            "let",
            "var",
          ]),
          {
            blankLine: "any",
            prev: ["const", "let", "var"],
            next: ["const", "let", "var"],
          },
          { blankLine: "never", prev: ["case", "default"], next: "*" },
          { blankLine: "always", prev: "directive", next: "*" },
        ],
      },
    },
  ],
});
