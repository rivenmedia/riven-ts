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
        const completed = await api.waitForCompletion(altmountId);
        // Seasons (and shows) download a multi-file pack; movies/episodes a
        // single file. The pack lands in its own subdir so every video file in
        // it belongs to the release.
        const multiFile =
          event.item.type === "season" || event.item.type === "show";
        const files = await api.resolveCompletedFiles(completed, { multiFile });
        return {
          altmountId,
          status: completed.status,
          files,
        };
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
