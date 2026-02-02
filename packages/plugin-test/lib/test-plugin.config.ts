import type { RivenPluginConfig } from "@repo/util-plugin-sdk";

export const pluginConfig = {
  name: Symbol.for("@repo/plugin-test"),
} satisfies RivenPluginConfig;
