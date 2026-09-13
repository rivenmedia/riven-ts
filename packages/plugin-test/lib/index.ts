/* eslint-disable @typescript-eslint/no-empty-function */
import packageJson from "../package.json" with { type: "json" };
import { TestAPI } from "./datasource/test.datasource.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { pluginConfig } from "./test-plugin.config.ts";
import { TestSettings } from "./test-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export const plugin: RivenPlugin = {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [TestAPI],
  resolvers: [TestResolver, TestSettingsResolver],
  hooks: {
    "riven.core.started": async () => {},
    "riven.item-request.create.error.conflict": async () => {},
    "riven.item-request.create.error": async () => {},
    "riven.item-request.create.success": async () => {},
  },
  settingsSchema: TestSettings,
  async validator() {
    return Promise.resolve(true);
  },
};
