import { Episode, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { createHash } from "node:crypto";

import packageJson from "../package.json" with { type: "json" };
import { SubdlAPI } from "./datasource/subdl.datasource.ts";
import { SubdlSettingsResolver } from "./schema/subdl-settings.resolver.ts";
import { SubdlResolver } from "./schema/subdl.resolver.ts";
import { pluginConfig } from "./subdl-plugin.config.ts";
import { SubdlSettings } from "./subdl-settings.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { SubtitleData } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

export default {
  name: pluginConfig.name,
  version: packageJson.version,
  dataSources: [SubdlAPI],
  resolvers: [SubdlResolver, SubdlSettingsResolver],
  hooks: {
    "riven.media-item.subtitle.requested": async ({
      dataSources,
      event,
      settings,
      logger,
    }) => {
      const api = dataSources.get(SubdlAPI);
      const { languages } = settings.get(SubdlSettings);
      const item = event.item;

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
        return { subtitles: [] };
      }

      if (!tmdbId && !imdbId) {
        logger.warn(
          `No TMDB/IMDB ID found for ${item.fullTitle}, skipping subtitle download`,
        );
        return { subtitles: [] };
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
        return { subtitles: [] };
      }

      // Pick the best subtitle per language (first result per language)
      const bestPerLanguage = new Map<string, (typeof results)[0]>();
      for (const sub of results) {
        const subLangLower = sub.language.toLowerCase();
        if (!bestPerLanguage.has(subLangLower)) {
          bestPerLanguage.set(subLangLower, sub);
        }
      }

      const subtitles: SubtitleData[] = [];

      for (const [language, sub] of bestPerLanguage) {
        try {
          const content = await api.downloadSubtitle(sub.url);
          if (!content) {
            logger.warn(
              `Failed to extract .srt from ZIP for ${item.fullTitle} (${language})`,
            );
            continue;
          }

          subtitles.push({
            language,
            content,
            fileSize: Buffer.byteLength(content, "utf8"),
            fileHash: createHash("md5").update(content).digest("hex"),
            sourceProvider: "subdl",
            sourceId: sub.url,
          });
        } catch (error) {
          logger.warn(
            `Failed to download subtitle for ${item.fullTitle} (${language}): ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (subtitles.length > 0) {
        logger.info(
          `Downloaded ${subtitles.length.toString()} subtitle(s) for ${item.fullTitle}`,
        );
      }

      return { subtitles };
    },
  },
  settingsSchema: SubdlSettings,
  validator() {
    return Promise.resolve(true);
  },
} satisfies RivenPlugin as RivenPlugin;
