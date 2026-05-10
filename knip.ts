import type { KnipConfiguration } from "knip";

const defaultEntry = ["lib/index.ts"];
const defaultProject = ["lib/**/*.ts"];

export default {
  $schema: "https://unpkg.com/knip@6/schema.json",
  tags: ["-lintignore"],
  node: true,
  vitest: true,
  eslint: true,
  husky: true,
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
        "lib/mikro-orm.config.ts",
        "esbuild.config.ts",
        "graphql-codegen.ts",
      ],
      project: [...defaultProject, "!lib/**/Migration*.ts"],
    },
  },
} satisfies KnipConfiguration;
