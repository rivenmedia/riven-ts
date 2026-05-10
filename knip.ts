import type { KnipConfiguration } from "knip";

const defaultEntry = ["lib/index.ts"];
const defaultProject = ["lib/**/*.ts"];
const configFileNames = {
  esbuild: "esbuild.config.ts",
  graphqlCodegen: "graphql-codegen.ts",
  mikroOrm: "mikro-orm.config.ts",
};

export default {
  tags: ["-lintignore"],
  node: true,
  vitest: true,
  eslint: true,
  husky: true,
  treatConfigHintsAsErrors: true,
  workspaces: {
    ".": {
      entry: [".husky/install.mjs"],
      project: ["turbo/generators/config.ts"],
    },
    "{packages,packages/core}/*": {
      entry: defaultEntry,
      project: defaultProject,
    },
    "apps/riven": {
      entry: [
        ...defaultEntry,
        configFileNames.mikroOrm,
        configFileNames.esbuild,
        configFileNames.graphqlCodegen,
      ],
      project: [...defaultProject, "!lib/**/Migration*.ts"],
    },
  },
} satisfies KnipConfiguration;
