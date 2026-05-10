import type { KnipConfiguration } from "knip";

const filePatterns = {
  sourceFiles: "**/*.ts!",
  // generatedFiles: "**/__generated__/**/*.ts!",
  scriptFiles: "**/scripts/**/*.ts!",
  testFiles: ["!**/*.{spec,test}.ts!", "!**/{__tests__,__mocks__}/**!"],

  // Tooling configs
  configFiles: "**/*.config.ts!",
  setupFiles: "**/*.setup.ts!",
  graphqlCodegenConfig: "graphql-codegen.ts!",
} as const;

const defaultEntry = [
  "**/lib/index.ts!",
  filePatterns.scriptFiles,
  filePatterns.configFiles,
  filePatterns.setupFiles,
  filePatterns.graphqlCodegenConfig,
] as const;

const defaultProject = [
  filePatterns.sourceFiles,
  // filePatterns.generatedFiles,
  ...filePatterns.testFiles,
] as const;

export default {
  tags: ["-lintignore"],
  treatConfigHintsAsErrors: true,
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
      project: [...defaultProject],
    },
    "{packages,packages/core}/*": {
      entry: [...defaultEntry],
      project: [...defaultProject],
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
  },
} satisfies KnipConfiguration;
