import type { KnipConfiguration } from "knip";

const filePatterns = {
  sourceFiles: "**/*.ts!",
  generatedProdFiles: "**/__generated__/zod/*.ts!",
  generatedDevFiles: "**/__generated__/{handlers,mocks}/*.ts",
  scriptFiles: "**/scripts/**/*.ts",
  testFiles: ["!**/*.{spec,test}.ts!", "!**/__{tests,mocks}__/**!"],

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
      ignoreBinaries: ["tail", "jq"],
    },
    "apps/wiki": {
      entry: [
        "app/**/{layout,page,template,loading,error,not-found,default,global-error}.tsx!",
        "app/**/{manifest,sitemap,robots}.ts!",
        "app/**/route.ts!",
        "app/api/**/route.ts!",
        "mdx-components.tsx!",
        "scripts/*.mjs",
        "next.config.ts!",
        "postcss.config.mjs!",
      ],
      project: ["**/*.{ts,tsx,mjs}!", "!source.config.ts"],
      ignoreDependencies: ["tailwindcss", /@repo\/(.*)/],
    },
    "apps/riven": {
      entry: [...defaultEntry, "!**/Migration*.ts!"],
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
