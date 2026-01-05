/* eslint-disable @typescript-eslint/no-empty-function */
import { type RivenPlugin } from "@repo/util-plugin-sdk";

import { TestAPI } from "./datasource/test.datasource.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { pluginConfig } from "./test-plugin.config.ts";

export default {
  name: pluginConfig.name,
  dataSources: [TestAPI],
  resolvers: [TestResolver, TestSettingsResolver],
  hooks: {
    "riven.core.started": () => {},
    "riven.media-item.creation.already-exists": () => {},
    "riven.media-item.creation.error": () => {},
    "riven.media-item.creation.success": () => {},
  },
  validator() {
    return true;
  },
} satisfies RivenPlugin;
