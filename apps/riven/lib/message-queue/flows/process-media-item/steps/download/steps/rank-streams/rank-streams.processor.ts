import { ShowLikeMediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { GarbageTorrentError } from "@repo/util-rank-torrent-name";

import { NotFoundError } from "@mikro-orm/core";
import chalk from "chalk";

import { SkippedTorrentError } from "#message-queue/sandboxed-jobs/jobs/parse-scrape-results/utilities/validate-torrent.ts";
import { getRankingEngine } from "#ranking/ranking-engine.ts";
import { logger } from "#utilities/logger/logger.ts";
import { getRuntimeSettings } from "#utilities/runtime-settings.ts";
import { coreEnvironment } from "#utilities/settings.ts";

import { rankStreamsProcessorSchema } from "./rank-streams.schema.ts";
import { sortByRankAndResolution } from "./utilities/sort-by-rank-and-resolution.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const rankStreamsProcessor = rankStreamsProcessorSchema.implementAsync(
  async (
    { job },
    {
      services: {
        mediaItemService,
        downloaderService,
        rankingProfileService,
        settingsService,
      },
    },
  ) => {
    // Store a snapshot of the ranking engine for
    // the whole job to allow for consistent ranking
    // even if the ranking config changes mid-invocation.
    const rtn = await getRankingEngine({
      rankingProfileService,
      settingsService,
      environment: coreEnvironment,
    });

    const streams = await downloaderService.findMatchingStreams(
      Object.keys(job.data.streams),
    );

    if (streams.length === 0) {
      return [];
    }

    const item = await mediaItemService.getMediaItemById(job.data.id);

    const { title: itemTitle, aliases } =
      item instanceof ShowLikeMediaItem ? await item.getShow() : item;

    const rankedResults: RankedResult[] = [];

    for (const [hash, rawTitle] of Object.entries(job.data.streams)) {
      try {
        const stream = streams.find(({ infoHash }) => infoHash === hash);

        if (!stream) {
          throw new NotFoundError(
            `No stream found for hash ${chalk.bold(hash)}`,
            Stream,
          );
        }

        const { parsedData } = stream;

        if (
          item.isAnime &&
          getRuntimeSettings().general.scraping.dubbedAnimeOnly &&
          !parsedData.dubbed
        ) {
          throw new SkippedTorrentError(
            "Skipping non-dubbed anime torrent",
            itemTitle,
            rawTitle,
            hash,
          );
        }

        rankedResults.push(
          rtn.rankTorrent(rawTitle, hash, itemTitle, aliases ?? {}),
        );
      } catch (error) {
        if (
          error instanceof GarbageTorrentError ||
          error instanceof SkippedTorrentError
        ) {
          logger.silly(error.message);
        } else {
          logger.error(
            `Failed to rank torrent ${rawTitle} (${hash}) for ${itemTitle}:`,
            { err: error },
          );
        }
      }
    }

    const bucketedTorrents = rtn.sortTorrents(rankedResults);
    const sortedTorrentsByResolution = bucketedTorrents.toSorted(
      sortByRankAndResolution,
    );

    return sortedTorrentsByResolution;
  },
);
