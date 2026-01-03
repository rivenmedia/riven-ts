import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";
import { parsePluginsFromDependencies } from "@repo/util-plugin-sdk";

import { buildSchema } from "type-graphql";

import packageJson from "../package.json" with { type: "json" };

const { validPlugins } = await parsePluginsFromDependencies(
  packageJson.dependencies,
  import.meta.resolve.bind(null),
);

export const schema = await buildSchema({
  resolvers: [
    CoreSettingsResolver,
    RivenSettingsResolver,
    ...validPlugins.flatMap((p) => p.resolvers),
  ],
  validate: true,
});
