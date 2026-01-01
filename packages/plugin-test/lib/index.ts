import {
  type RivenPlugin,
  createPluginRunner,
  createPluginValidator,
} from "@repo/util-plugin-sdk";

import { TestAPI } from "./datasource/test.datasource.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { pluginConfig } from "./test-plugin.config.ts";

export default {
  name: pluginConfig.name,
  dataSources: [TestAPI],
  resolvers: [TestResolver, TestSettingsResolver],
  runner: createPluginRunner(async () => {
    /* empty */
  }),
  validator: createPluginValidator(() => true),
} satisfies RivenPlugin;
