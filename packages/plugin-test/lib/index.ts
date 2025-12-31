import { pluginConfig } from "./test-plugin.config.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { createPluginRunner, type RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  resolvers: [TestResolver, TestSettingsResolver],
  runner: createPluginRunner(async () => {
    /* empty */
  }),
} satisfies RivenPlugin;
