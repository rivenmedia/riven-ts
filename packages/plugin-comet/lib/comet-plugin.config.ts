import packageJson from "../package.json" with { type: "json" };

import type { RivenPluginConfig } from "@rivenmedia/plugin-sdk";

export const pluginConfig = {
  name: Symbol(packageJson.name),
} satisfies RivenPluginConfig;
