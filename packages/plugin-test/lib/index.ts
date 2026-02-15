/* eslint-disable @typescript-eslint/no-empty-function */
import packageJson from "../package.json" with { type: "json" };
import { TestAPI } from "./datasource/test.datasource.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { pluginConfig } from "./test-plugin.config.ts";
import { TestSettings } from "./test-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TestAPI],
  resolvers: [TestResolver, TestSettingsResolver],
  hooks: {
    "riven.core.started": async () => {},
    "riven.media-item.creation.error.conflict": async () => {},
    "riven.media-item.creation.error": async () => {},
    "riven.item-request.creation.success": async () => {},
  },
  settingsSchema: TestSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;
