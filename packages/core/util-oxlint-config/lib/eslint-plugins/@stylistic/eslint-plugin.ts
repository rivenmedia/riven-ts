import { defineConfig } from "oxlint";

import { tsFiles, jsFiles } from "../../internal/file-types.ts";

import type { Arrayable } from "type-fest";

const callableSelector = {
  selector: "ExpressionStatement:has(> CallExpression)",
};

const variableDeclaration = ["const", "let", "var"];

function paddedLineAround(
  statementType: Arrayable<string | { selector: string }>,
) {
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
            ...variableDeclaration,
            callableSelector,
          ]),
          {
            blankLine: "any",
            prev: variableDeclaration,
            next: variableDeclaration,
          },
          {
            blankLine: "any",
            prev: callableSelector,
            next: callableSelector,
          },
          { blankLine: "never", prev: ["case", "default"], next: "*" },
          { blankLine: "always", prev: "directive", next: "*" },
        ],
      },
    },
  ],
});
