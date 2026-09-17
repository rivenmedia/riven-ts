import { buildSchema } from "@repo/core-util-graphql-schema";

import { resolvers } from "../lib/graphql/resolvers/index.ts";

import type { PackageJson } from "type-fest";

type ResolverClass = abstract new (...args: never[]) => unknown;

const PLUGIN_NAME_PATTERN = /^@repo\/plugin-(?<pluginName>[a-z0-9-]+)$/u;

const { default: packageJson } = (await import(
  import.meta.resolve(`${process.cwd()}/package.json`),
  { with: { type: "json" } }
)) as { default: PackageJson };

const pluginNames = Object.keys(packageJson.dependencies ?? {})
  .filter((pluginName) => PLUGIN_NAME_PATTERN.test(pluginName))
  .toSorted();

const pluginResolvers: ResolverClass[] = [];

for (const pluginName of pluginNames) {
  const { plugin } = (await import(pluginName)) as {
    plugin: { resolvers: ResolverClass[] };
  };

  pluginResolvers.push(...plugin.resolvers);
}

await buildSchema({
  resolvers: [...resolvers, ...pluginResolvers],
  emitSchemaFile: "schema.graphql",
});
