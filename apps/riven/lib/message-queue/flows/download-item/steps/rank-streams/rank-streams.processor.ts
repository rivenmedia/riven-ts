import { ShowLikeMediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
} from "@repo/util-rank-torrent-name";

import { NotFoundError } from "@mikro-orm/core";
import chalk from "chalk";

import { repositories } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../utilities/settings.ts";
import { SkippedTorrentError } from "../../../../sandboxed-jobs/jobs/parse-scrape-results/utilities/validate-torrent.ts";
import { rankStreamsProcessorSchema } from "./rank-streams.schema.ts";
import { sortByRankAndResolution } from "./utilities/sort-by-rank-and-resolution.ts";

export const rankStreamsProcessor = rankStreamsProcessorSchema.implementAsync(
  async function ({ job }) {
    const streams = await repositories.stream.find({
      infoHash: {
        $in: Object.keys(job.data.streams),
      },
    });

    if (!streams.length) {
      return [];
    }

    const item = await repositories.mediaItem.findOneOrFail(job.data.id);

    const { title: itemTitle, aliases } =
      item instanceof ShowLikeMediaItem ? await item.getShow() : item;

    const rtnInstance = new RTN(job.data.rtnSettings, job.data.rtnRankingModel);

    const rankedResults = Object.entries(job.data.streams).reduce<
      RankedResult[]
    >((acc, [hash, rawTitle]) => {
      try {
        const stream = streams.find((s) => s.infoHash === hash);

        if (!stream) {
          throw new NotFoundError(
            `No stream found for hash ${chalk.bold(hash)}`,
            Stream,
          );
        }

        const { parsedData } = stream;

        if (item.isAnime && settings.dubbedAnimeOnly && !parsedData.dubbed) {
          throw new SkippedTorrentError(
            "Skipping non-dubbed anime torrent",
            itemTitle,
            rawTitle,
            hash,
          );
        }

        acc.push(
          rtnInstance.rankTorrent(rawTitle, hash, itemTitle, aliases ?? {}),
        );

        return acc;
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

        return acc;
      }
    }, []);

    const bucketedTorrents = rtnInstance.sortTorrents(rankedResults);
    const sortedTorrentsByResolution = bucketedTorrents.sort(
      sortByRankAndResolution,
    );

    return sortedTorrentsByResolution;
  },
);
