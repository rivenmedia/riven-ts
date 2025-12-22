import packageJson from "../package.json" with { type: "json" };
import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";
import { buildSchema } from "type-graphql";
import { parsePluginsFromDependencies } from "@repo/util-plugin-sdk";

const plugins = await parsePluginsFromDependencies(
  packageJson.dependencies,
  import.meta.resolve.bind(null),
);

export const schema = await buildSchema({
  resolvers: [
    CoreSettingsResolver,
    RivenSettingsResolver,
    ...plugins.flatMap((p) => p.resolvers),
  ],
  validate: true,
});
