import { ShowLikeMediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
} from "@repo/util-rank-torrent-name";

import { NotFoundError } from "@mikro-orm/core";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../utilities/settings.ts";
import { SkippedTorrentError } from "../../../scrape-item/steps/parse-scrape-results/utilities/validate-torrent.ts";
import { rankStreamsProcessorSchema } from "./rank-streams.schema.ts";

export const rankStreamsProcessor = rankStreamsProcessorSchema.implementAsync(
  async function ({ job }) {
    const item = await database.mediaItem.findOneOrFail(job.data.id);
    const streams = await database.stream.find({
      infoHash: {
        $in: Object.keys(job.data.streams),
      },
    });

    const { title: itemTitle } =
      item instanceof ShowLikeMediaItem ? await item.getShow() : item;

    const rtnInstance = new RTN(job.data.rtnSettings, job.data.rtnRankingModel);

    const rankedResults = Object.entries(job.data.streams).reduce<
      RankedResult[]
    >((acc, [hash, rawTitle]) => {
      try {
        const stream = streams.find((s) => s.infoHash === hash);

        if (!stream) {
          throw new NotFoundError(`No stream found for hash ${hash}`, Stream);
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

        return [...acc, rtnInstance.rankTorrent(rawTitle, hash, itemTitle)];
      } catch (error) {
        if (
          error instanceof GarbageTorrentError ||
          error instanceof SkippedTorrentError
        ) {
          logger.silly(error.message);
        } else {
          logger.error(
            `Failed to rank torrent ${rawTitle} (${hash}) for ${itemTitle}: ${
              (error as Error).message
            }`,
          );
        }

        return acc;
      }
    }, []);

    return rtnInstance.sortTorrents(rankedResults);
  },
);
