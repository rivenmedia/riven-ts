import packageJson from "../package.json" with { type: "json" };
import { MdblistAPI } from "./datasource/mdblist.datasource.ts";
import { pluginConfig } from "./mdblist-plugin.config.ts";
import { MdbListSettings } from "./mdblist-settings.schema.ts";
import { MdblistSettingsResolver } from "./schema/mdblist-settings.resolver.ts";
import { MdblistResolver } from "./schema/mdblist.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [MdblistAPI],
  resolvers: [MdblistResolver, MdblistSettingsResolver],
  hooks: {
    "riven.content-service.requested": async ({ dataSources, settings }) => {
      const { lists } = settings.get(MdbListSettings);
      const api = dataSources.get(MdblistAPI);

      return await api.getListItems(new Set(lists));
    },
  },
  settingsSchema: MdbListSettings,
  async validator() {
    return true;
  },
} satisfies RivenPlugin as RivenPlugin;
