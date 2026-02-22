import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";
import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
} from "@repo/util-rank-torrent-name";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { rankStreamsProcessorSchema } from "./rank-streams.schema.ts";

export const rankStreamsProcessor = rankStreamsProcessorSchema.implementAsync(
  async function ({ job }) {
    const item = await database.mediaItem.findOneOrFail(job.data.id);
    const itemTitle =
      item instanceof Episode || item instanceof Season
        ? (await item.getShow()).title
        : item.title;

    const rtnInstance = new RTN(job.data.rtnSettings, job.data.rtnRankingModel);

    const rankedResults = Object.entries(job.data.streams).reduce<
      RankedResult[]
    >((acc, [hash, rawTitle]) => {
      try {
        return [...acc, rtnInstance.rankTorrent(rawTitle, hash, itemTitle)];
      } catch (error) {
        if (error instanceof GarbageTorrentError) {
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
