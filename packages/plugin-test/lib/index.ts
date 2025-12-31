import { pluginConfig } from "./test-plugin.config.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { TestAPI } from "./datasource/test.datasource.ts";
import {
  createPluginRunner,
  createPluginValidator,
  type RivenPlugin,
} from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  dataSources: [TestAPI],
  resolvers: [TestResolver, TestSettingsResolver],
  runner: createPluginRunner(async () => {
    /* empty */
  }),
  validator: createPluginValidator(() => true),
} satisfies RivenPlugin;
