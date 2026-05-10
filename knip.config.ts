import type { KnipConfiguration } from "knip";

const filePatterns = {
  sourceFiles: "**/*.ts!",
  scriptFiles: "**/scripts/**/*.ts!",
  testFiles: ["!**/*.{spec,test}.ts!", "!**/{__tests__,__mocks__}/**!"],

  // Tooling configs
  configFiles: "**/*.config.ts",
  graphqlCodegenConfig: "graphql-codegen.ts!",
} as const;

const defaultEntry = [
  "**/lib/index.ts!",
  filePatterns.scriptFiles,
  filePatterns.configFiles,
  filePatterns.graphqlCodegenConfig,
] as const;

const defaultProject = [
  filePatterns.sourceFiles,
  ...filePatterns.testFiles,
] as const;

export default {
  tags: ["-lintignore"],
  treatConfigHintsAsErrors: true,

  workspaces: {
    ".": {
      entry: [".husky/install.mjs", "turbo/generators/config.ts"],
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
