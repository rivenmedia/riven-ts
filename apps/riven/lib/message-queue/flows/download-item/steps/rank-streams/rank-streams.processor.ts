import { Stream } from "@repo/util-plugin-sdk/dto/entities";
import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
} from "@repo/util-rank-torrent-name";

import { type TypedDocumentNode, gql } from "@apollo/client";
import { NotFoundError } from "@mikro-orm/core";
import chalk from "chalk";

import { client } from "../../../../../graphql/apollo-client.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../utilities/settings.ts";
import { SkippedTorrentError } from "../../../../sandboxed-jobs/jobs/parse-scrape-results/utilities/validate-torrent.ts";
import { rankStreamsProcessorSchema } from "./rank-streams.schema.ts";
import { sortByRankAndResolution } from "./utilities/sort-by-rank-and-resolution.ts";

import type {
  GetRankStreamsDataQuery,
  GetRankStreamsDataQueryVariables,
} from "./rank-streams.processor.typegen.ts";

const GET_RANK_STREAMS_DATA_QUERY: TypedDocumentNode<
  GetRankStreamsDataQuery,
  GetRankStreamsDataQueryVariables
> = gql`
  query GetRankStreamsData($id: ID!, $infoHashes: [String!]) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        isAnime
        title
        streams(infoHashes: $infoHashes) {
          infoHash
          parsedData
        }
      }

      ... on Episode {
        season {
          show {
            title
          }
        }
      }

      ... on Season {
        show {
          title
        }
      }

      ... on Movie {
        aliases
      }

      ... on Show {
        aliases
      }
    }
  }
`;

export const rankStreamsProcessor = rankStreamsProcessorSchema.implementAsync(
  async function ({ job }) {
    const { data } = await client.query({
      query: GET_RANK_STREAMS_DATA_QUERY,
      variables: {
        id: job.data.id,
        infoHashes: Object.keys(job.data.streams),
      },
    });

    if (!data?.mediaItemById) {
      throw new Error(
        "Failed to fetch media item data for rank streams processor",
      );
    }

    const { isAnime, streams, __typename } = data.mediaItemById;
    const aliases =
      __typename === "Movie" || __typename === "Show"
        ? data.mediaItemById.aliases
        : undefined;

    const itemTitle =
      __typename === "Episode"
        ? data.mediaItemById.season.show.title
        : __typename === "Season"
          ? data.mediaItemById.show.title
          : data.mediaItemById.title;

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

        if (isAnime && settings.dubbedAnimeOnly && !parsedData["dubbed"]) {
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
