import type { RivenPluginConfig } from "@repo/util-plugin-sdk";

export const pluginConfig = {
  name: Symbol.for("@rivenmedia/riven-plugin-test"),
} satisfies RivenPluginConfig;
