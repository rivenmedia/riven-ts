import {
  Episode,
  Movie,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities";

import { ref } from "@mikro-orm/core";
import { createHash } from "node:crypto";

import packageJson from "../package.json" with { type: "json" };
import { SubdlAPI } from "./datasource/subdl.datasource.ts";
import { SubdlSettingsResolver } from "./schema/subdl-settings.resolver.ts";
import { SubdlResolver } from "./schema/subdl.resolver.ts";
import { pluginConfig } from "./subdl-plugin.config.ts";
import { SubdlSettings } from "./subdl-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SubdlAPI],
  resolvers: [SubdlResolver, SubdlSettingsResolver],
  hooks: {
    "riven.media-item.download.success": async ({
      dataSources,
      event,
      settings,
      logger,
    }) => {
      const api = dataSources.get(SubdlAPI);
      const { languages } = settings.get(SubdlSettings);
      const item = event.item;

      const mediaEntries = await item.getMediaEntries();
      if (mediaEntries.length === 0) {
        logger.warn(
          `No media entries found for ${item.fullTitle}, skipping subtitle download`,
        );
        return;
      }

      const firstMediaEntry = mediaEntries[0];
      if (!firstMediaEntry) {
        return;
      }

      let tmdbId: string | undefined;
      let imdbId: string | undefined;
      let seasonNumber: number | undefined;
      let episodeNumber: number | undefined;
      let type: "movie" | "tv";

      if (item instanceof Movie) {
        tmdbId = item.tmdbId;
        imdbId = item.imdbId ?? undefined;
        type = "movie";
      } else if (item instanceof Episode) {
        imdbId = item.imdbId ?? undefined;
        type = "tv";
        seasonNumber = item.season.getProperty("number");
        episodeNumber = item.number;
      } else {
        return;
      }

      if (!tmdbId && !imdbId) {
        logger.warn(
          `No TMDB/IMDB ID found for ${item.fullTitle}, skipping subtitle download`,
        );
        return;
      }

      const results = await api.searchSubtitles({
        tmdbId,
        imdbId,
        type,
        seasonNumber,
        episodeNumber,
        languages,
      });

      if (results.length === 0) {
        logger.debug(`No subtitles found for ${item.fullTitle}`);
        return;
      }

      // Pick the best subtitle per language (first result per language)
      const bestPerLanguage = new Map<string, (typeof results)[0]>();
      for (const sub of results) {
        if (!bestPerLanguage.has(sub.lang)) {
          bestPerLanguage.set(sub.lang, sub);
        }
      }

      let downloadedCount = 0;

      for (const [language, sub] of bestPerLanguage) {
        try {
          const content = await api.downloadSubtitle(sub.url);
          if (!content) {
            logger.warn(
              `Failed to extract .srt from ZIP for ${item.fullTitle} (${language})`,
            );
            continue;
          }

          const subtitleEntry = new SubtitleEntry();
          subtitleEntry.language = language;
          subtitleEntry.content = content;
          subtitleEntry.fileSize = Buffer.byteLength(content, "utf8");
          subtitleEntry.fileHash = createHash("md5")
            .update(content)
            .digest("hex");
          subtitleEntry.videoFileSize = firstMediaEntry.fileSize;
          subtitleEntry.parentOriginalFilename =
            firstMediaEntry.originalFilename;
          subtitleEntry.mediaItem = ref(item);

          item.filesystemEntries.add(subtitleEntry);
          downloadedCount++;
        } catch (error) {
          logger.warn(
            `Failed to download subtitle for ${item.fullTitle} (${language}): ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (downloadedCount > 0) {
        logger.info(
          `Downloaded ${downloadedCount.toString()} subtitle(s) for ${item.fullTitle}`,
        );
      }
    },
  },
  settingsSchema: SubdlSettings,
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;
