import packageJson from "../package.json" with { type: "json" };
import { pluginConfig } from "./altmount-plugin.config.ts";
import { AltmountSettings } from "./altmount-settings.schema.ts";
import { AltmountAPI } from "./datasource/altmount.datasource.ts";
import { AltmountSettingsResolver } from "./schema/altmount-settings.resolver.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [AltmountAPI],
  resolvers: [AltmountSettingsResolver],
  hooks: {
    "riven.media-item.nzb-download.requested": async ({
      dataSources,
      event,
    }) => {
      const api = dataSources.get(AltmountAPI);

      try {
        const altmountId = await api.addurl({
          nzbUrl: event.nzbUrl,
          expectedTitle: event.expectedTitle,
        });
        const status = await api.waitForCompletion(altmountId);
        return { altmountId, status };
      } catch (error) {
        throw new Error(
          `altmount download failed for "${event.expectedTitle}": ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    },
  },
  settingsSchema: AltmountSettings,
  async validator({ dataSources }) {
    return dataSources.get(AltmountAPI).validate();
  },
} satisfies RivenPlugin as RivenPlugin;
