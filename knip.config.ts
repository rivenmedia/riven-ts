import type { KnipConfiguration } from "knip";

const filePatterns = {
  sourceFiles: "**/*.ts!",
  generatedProdFiles: "**/__generated__/zod/*.ts!",
  generatedDevFiles: "**/__generated__/{handlers,mocks}/*.ts",
  scriptFiles: "**/scripts/**/*.ts",
  testFiles: ["!**/*.{spec,test}.ts!", "!**/{__tests__,__mocks__}/**!"],

  // Tooling configs
  configFiles: "**/*.config.ts",
  setupFiles: "**/*.setup.ts",
  graphqlCodegenConfig: "graphql-codegen.ts",
} as const;

const defaultEntry = [
  "**/lib/index.ts!",
  filePatterns.generatedProdFiles,
  filePatterns.generatedDevFiles,
  filePatterns.scriptFiles,
  filePatterns.configFiles,
  filePatterns.setupFiles,
  filePatterns.graphqlCodegenConfig,
] as const;

const defaultProject = [
  filePatterns.sourceFiles,
  filePatterns.generatedDevFiles,
  filePatterns.generatedProdFiles,
  ...filePatterns.testFiles,
] as const;

export default {
  tags: ["-lintignore"],
  ignoreDependencies: [
    "@typescript-eslint/parser",
    "@kubb/cli",
    "@graphql-codegen/*",
    "@graphql-typed-document-node/*",
    "@swc-node/register",
    "@vitest/coverage-v8",
    "(?!-)vscode(?!-)", // Ignore VSCode packages - these tend to be used by editors and not the program
  ],
  workspaces: {
    ".": {
      entry: [".husky/install.mjs", "turbo/generators/config.ts!"],
      project: ["turbo/**/*.ts"],
    },
    "apps/riven": {
      entry: [...defaultEntry],
      project: [
        ...defaultProject,
        "!**/Migration*.ts",
        "!**/{factories,seeders}!",
      ],
      ignoreDependencies: [/@repo\/plugin(.*)/],
    },
    "{packages,packages/core}/*": {
      entry: [...defaultEntry],
      project: [...defaultProject],
    },
  },
} satisfies KnipConfiguration;
