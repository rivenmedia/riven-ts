import packageJson from "../package.json" with { type: "json" };

import type { RivenPluginConfig } from "@repo/util-plugin-sdk/schemas";

export const pluginConfig = {
  name: Symbol(packageJson.name),
} satisfies RivenPluginConfig;
