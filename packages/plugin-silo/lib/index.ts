import path from "node:path";

import packageJson from "../package.json" with { type: "json" };
import { SiloAPI } from "./datasource/silo.datasource.ts";
import { SiloSettingsResolver } from "./schema/silo-settings.resolver.ts";
import { SiloResolver } from "./schema/silo.resolver.ts";
import { pluginConfig } from "./silo-plugin.config.ts";
import { SiloSettings } from "./silo-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export const plugin: RivenPlugin = {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SiloAPI],
  resolvers: [SiloResolver, SiloSettingsResolver],
  hooks: {
    "riven.media-item.download.success": async ({
      dataSources,
      event,
      logger,
    }) => {
      const siloAPI = dataSources.get(SiloAPI);
      const mediaEntries = await event.item.getMediaEntries();

      if (mediaEntries.length === 0) {
        throw new Error(
          `No media filesystem entry found for media item ID ${event.item.id}`,
        );
      }

      const scanPaths = [
        ...new Set(
          mediaEntries.map((entry) =>
            path.join(entry.baseDirectory, path.dirname(entry.path)),
          ),
        ),
      ];

      const results = await Promise.allSettled(
        scanPaths.map(async (scanPath) => siloAPI.scanPath(scanPath)),
      );

      const errors = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        )
        .map((result) =>
          result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason)),
        );

      if (errors.length > 0) {
        throw new Error(
          `Failed to scan Silo library paths for ${event.item.fullTitle}. ${errors.map((error) => error.message).join(", ")}`,
          { cause: errors },
        );
      }

      logger.info(
        `Requested Silo scan for ${scanPaths.length.toString()} path${scanPaths.length === 1 ? "" : "s"} for ${event.item.fullTitle}`,
      );
    },
  },
  settingsSchema: SiloSettings,
  async validator({ dataSources }) {
    return dataSources.get(SiloAPI).validate();
  },
};
