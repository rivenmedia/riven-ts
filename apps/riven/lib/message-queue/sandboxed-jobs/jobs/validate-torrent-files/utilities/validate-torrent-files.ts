import { parseFilePath } from "@repo/util-rank-torrent-name";

import { type TypedDocumentNode, gql } from "@apollo/client";
import chalk from "chalk";
import assert, { AssertionError } from "node:assert";

import { client } from "../../../../../graphql/apollo-client.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../utilities/settings.ts";
import { MatchedFile } from "../../../../flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.schema.ts";

import type { MapItemsToFilesSandboxedJob } from "../../map-items-to-files/map-items-to-files.schema.ts";
import type {
  GetValidateTorrentFilesEpisodeQuery,
  GetValidateTorrentFilesEpisodeQueryVariables,
  GetValidateTorrentFilesItemQuery,
  GetValidateTorrentFilesItemQueryVariables,
} from "./validate-torrent-files.typegen.ts";
import type { UUID } from "node:crypto";

export class InvalidTorrentError extends Error {}

function calculateAverageBitrate(fileSize: number, runtime: number) {
  return fileSize / runtime / (1024 * 1024);
}

const GET_VALIDATE_TORRENT_FILES_ITEM_QUERY: TypedDocumentNode<
  GetValidateTorrentFilesItemQuery,
  GetValidateTorrentFilesItemQueryVariables
> = gql`
  query GetValidateTorrentFilesItem($id: ID!) {
    mediaItemById(id: $id) {
      ... on MediaItem {
        fullTitle
        type
        expectedFileCount
      }

      ... on ShowLikeMediaItem {
        tvdbId
      }

      ... on Movie {
        runtime
      }

      ... on Episode {
        tvdbId
        runtime
        lookupKeys
        number
        season {
          number
        }
      }

      ... on Season {
        number
        tvdbId
        episodes {
          lookupKeys
        }
      }

      ... on Show {
        status
        tvdbId
        seasons {
          totalEpisodes
          episodes {
            lookupKeys
          }
        }
      }
    }
  }
`;

const GET_VALIDATE_TORRENT_FILES_EPISODE_QUERY: TypedDocumentNode<
  GetValidateTorrentFilesEpisodeQuery,
  GetValidateTorrentFilesEpisodeQueryVariables
> = gql`
  query GetValidateTorrentFilesEpisode(
    $tvdbId: String!
    $episodeNumber: Int!
    $seasonNumber: Int
  ) {
    episode(
      tvdbId: $tvdbId
      episodeNumber: $episodeNumber
      seasonNumber: $seasonNumber
    ) {
      id
      number
      season {
        number
      }
    }
  }
`;

export const validateTorrentFiles = async (
  itemId: UUID,
  infoHash: string,
  { episodes, movies }: MapItemsToFilesSandboxedJob["output"],
  isCacheCheck: boolean,
): Promise<MatchedFile[]> => {
  try {
    const itemResult = await client.query({
      query: GET_VALIDATE_TORRENT_FILES_ITEM_QUERY,
      variables: { id: itemId },
    });

    if (!itemResult.data?.mediaItemById) {
      throw new Error(`Media item with ID ${itemId} not found`);
    }

    const item = itemResult.data.mediaItemById;

    logger.verbose(
      `Validating torrent files for item ${chalk.bold(item.fullTitle)}: ${chalk.bold(infoHash)}`,
    );

    const groupMap = new Map(
      Object.entries(item.__typename === "Movie" ? movies : episodes),
    );

    assert(
      groupMap.size >= item.expectedFileCount,
      `${item.type.substring(0, 1).toUpperCase() + item.type.substring(1)} torrent must have at least ${item.expectedFileCount.toString()} ${item.__typename === "Movie" ? "movies" : "episodes"}, but has ${groupMap.size.toString()}`,
    );

    const validFiles: MatchedFile[] = [];

    if (item.__typename === "Movie") {
      const files = groupMap
        .values()
        .toArray()
        .sort((a, b) => b.size - a.size);

      for (const file of files) {
        try {
          const parseData = parseFilePath(file.path);

          assert(parseData.type === "movie", "File must be a movie");

          if (item.runtime && settings.minimumAverageBitrateMovies) {
            const bitrate = calculateAverageBitrate(file.size, item.runtime);

            // TODO: If this assertion fails, we can probably skip checking all other files.
            // Average bitrate is proportional to the file size, and the files are ordered by size.
            assert(
              bitrate >= settings.minimumAverageBitrateMovies,
              `File bitrate is ${bitrate.toString()}, under the configured minimum bitrate of ${settings.minimumAverageBitrateMovies.toString()} for movies`,
            );
          }

          validFiles.push(
            MatchedFile.parse({
              ...file,
              matchedMediaItemId: itemId,
              isCachedFile: isCacheCheck,
            }),
          );

          break;
        } catch (error) {
          logger.debug(
            `File ${chalk.bold(file.name)} failed validation: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    if (
      item.__typename === "Episode" ||
      item.__typename === "Season" ||
      item.__typename === "Show"
    ) {
      const lookupKeys =
        item.__typename === "Episode"
          ? item.lookupKeys
          : item.__typename === "Season"
            ? item.episodes.flatMap((episode) => episode.lookupKeys)
            : item.seasons.flatMap((season) =>
                season.episodes.flatMap((episode) => episode.lookupKeys),
              );

      for (const lookupKey of lookupKeys) {
        const file = groupMap.get(lookupKey);

        if (!file) {
          continue;
        }

        logger.debug(
          `Found match in ${isCacheCheck ? "cached files" : "torrent files"}: ${chalk.bold(file.name)} for item ${chalk.bold(item.fullTitle)} using lookup key '${chalk.bold(lookupKey)}'`,
        );

        try {
          const parseData = parseFilePath(file.path);

          assert(
            parseData.type === "show",
            "Expected an episode, but found a movie",
          );

          assert(
            parseData.episodes[0] != null,
            "File must have at least one episode number",
          );

          const episodeResult = await client.query({
            query: GET_VALIDATE_TORRENT_FILES_EPISODE_QUERY,
            variables: {
              tvdbId: item.tvdbId,
              episodeNumber: parseData.episodes[0],
              seasonNumber: parseData.seasons[0] ?? null,
            },
          });

          assert(
            episodeResult.data?.episode,
            `File must correspond to a valid episode in ${item.fullTitle}`,
          );

          const { episode } = episodeResult.data;

          if (item.__typename === "Season") {
            assert(
              episode.season.number === item.number,
              `File must correspond to a valid episode in ${item.fullTitle}`,
            );
          }

          if (item.__typename === "Episode") {
            assert(
              episode.number === item.number &&
                episode.season.number === item.season.number,
              `Incorrect episode for ${item.fullTitle}`,
            );

            if (item.runtime && settings.minimumAverageBitrateEpisodes) {
              const bitrate = calculateAverageBitrate(file.size, item.runtime);

              assert(
                bitrate >= settings.minimumAverageBitrateEpisodes,
                `File bitrate is ${bitrate.toString()}, under the configured minimum bitrate of ${settings.minimumAverageBitrateEpisodes.toString()} for episodes`,
              );
            }
          }

          validFiles.push(
            MatchedFile.parse({
              ...file,
              matchedMediaItemId: episode.id,
              isCachedFile: isCacheCheck,
            }),
          );
        } catch (error) {
          logger.debug(
            `File ${chalk.bold(file.name)} failed validation: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    assert(
      item.expectedFileCount <= validFiles.length,
      `Expected at least ${item.expectedFileCount.toString()} valid files, but found ${validFiles.length.toString()}`,
    );

    return validFiles;
  } catch (error) {
    if (error instanceof AssertionError) {
      throw new InvalidTorrentError(error.message);
    }

    throw error;
  }
};
