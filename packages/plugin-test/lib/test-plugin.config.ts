import type { RivenPluginConfig } from "@rivenmedia/plugin-sdk";

export const pluginConfig = {
  name: Symbol.for("@rivenmedia/riven-plugin-test"),
} satisfies RivenPluginConfig;
