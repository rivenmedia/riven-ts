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
    "apps/dashboard": {
      // SvelteKit's `+page.*` / `+layout.*` / `+server.*` / `+error.*`
      // entry points are picked up by knip's bundled `@sveltejs/kit`
      // plugin. The additions below cover surfaces the plugin can't
      // infer:
      //
      //   - shadcn-svelte barrel indexes that re-export each component
      //     under both a short and a prefixed name (`Root` + `Card`,
      //     etc.); consumers pick one, so every export needs to be
      //     considered public.
      //   - the GraphQL barrel (`$lib/graphql`) which is the canonical
      //     import path for `client`, `createClient`, `gql`, and the
      //     `TypedDocumentNode` type — pages import from it, but knip
      //     doesn't otherwise see `createClient` getting used.
      //   - generic config / setup files, consistent with the other
      //     workspaces.
      entry: [
        "src/lib/components/ui/*/index.ts!",
        "src/lib/graphql/index.ts!",
        filePatterns.configFiles,
        filePatterns.setupFiles,
        filePatterns.graphqlCodegenConfig,
      ],
      project: ["src/**/*.{ts,svelte}!", "!src/lib/graphql/__generated__/**/*"],
      // `@sveltejs/kit` lives in devDependencies per the official
      // SvelteKit convention (the framework code is bundled at build
      // time). Knip's `--strict` mode flags any production import of a
      // devDependency as "unlisted"; suppressing here keeps the strict
      // check meaningful for everything else.
      ignoreDependencies: ["@sveltejs/kit"],
    },
    "{packages,packages/core}/*": {
      entry: [...defaultEntry],
      project: [...defaultProject],
    },
  },
} satisfies KnipConfiguration;
