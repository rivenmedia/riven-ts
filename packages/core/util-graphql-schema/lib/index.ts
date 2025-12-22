import packageJson from "../package.json" with { type: "json" };
import { SettingsResolver } from "@repo/feature-settings/resolver";
import { buildSchema } from "type-graphql";
import { parsePluginsFromDependencies } from "@repo/util-plugin-sdk";

const plugins = await parsePluginsFromDependencies(
  packageJson.dependencies,
  import.meta.resolve.bind(null),
);

export const schema = await buildSchema({
  resolvers: [SettingsResolver, ...plugins.flatMap((p) => p.resolvers)],
  validate: true,
});
