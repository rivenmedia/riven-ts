/* eslint-disable @typescript-eslint/no-empty-function */
import packageJson from "../package.json" with { type: "json" };
import { TestAPI } from "./datasource/test.datasource.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import { pluginConfig } from "./test-plugin.config.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
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
