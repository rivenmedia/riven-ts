import { parseFilePath } from "@repo/util-rank-torrent-name";

import { gql } from "@apollo/client";
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
import type { TypedDocumentNode } from "@apollo/client";
import type { UUID } from "node:crypto";

export class InvalidTorrentError extends Error {
  public override name = "InvalidTorrentError";
}

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

type ValidateTorrentFilesItem = NonNullable<
  GetValidateTorrentFilesItemQuery["mediaItemById"]
>;

type ShowLikeValidateTorrentFilesItem = Extract<
  ValidateTorrentFilesItem,
  { __typename: "Episode" | "Season" | "Show" }
>;

type TorrentFile = MapItemsToFilesSandboxedJob["output"]["movies"][string];

function logFileValidationFailure(file: TorrentFile, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  logger.debug(
    `File ${chalk.bold(file.name)} failed validation: ${errorMessage}`,
  );
}

function getValidMovieFiles(
  item: Extract<ValidateTorrentFilesItem, { __typename: "Movie" }>,
  itemId: UUID,
  groupMap: Map<string, TorrentFile>,
  isCacheCheck: boolean,
): MatchedFile[] {
  const files = groupMap
    .values()
    .toArray()
    .toSorted((a, b) => b.size - a.size);

  for (const file of files) {
    try {
      const parseData = parseFilePath(file.path);

      assert.ok(parseData.type === "movie", "File must be a movie");

      if (item.runtime && settings.minimumAverageBitrateMovies) {
        const bitrate = calculateAverageBitrate(file.size, item.runtime);

        // TODO: If this assertion fails, we can probably skip checking all other files.
        // Average bitrate is proportional to the file size, and the files are ordered by size.
        assert.ok(
          bitrate >= settings.minimumAverageBitrateMovies,
          `File bitrate is ${bitrate.toString()}, under the configured minimum bitrate of ${settings.minimumAverageBitrateMovies.toString()} for movies`,
        );
      }

      return [
        MatchedFile.parse({
          ...file,
          matchedMediaItemId: itemId,
          isCachedFile: isCacheCheck,
        }),
      ];
    } catch (error) {
      logFileValidationFailure(file, error);
    }
  }

  return [];
}

function getLookupKeys(item: ShowLikeValidateTorrentFilesItem) {
  switch (item.__typename) {
    case "Episode": {
      return item.lookupKeys;
    }
    case "Season": {
      return item.episodes.flatMap((episode) => episode.lookupKeys);
    }
    case "Show": {
      return item.seasons.flatMap((season) =>
        season.episodes.flatMap((episode) => episode.lookupKeys),
      );
    }
  }
}

/**
 * Validates that a file corresponds to the expected episode of the item.
 *
 * @returns The ID of the episode that the file matches
 */
async function getMatchedEpisodeId(
  item: ShowLikeValidateTorrentFilesItem,
  file: TorrentFile,
) {
  const parseData = parseFilePath(file.path);

  assert.ok(
    parseData.type === "show",
    "Expected an episode, but found a movie",
  );

  assert.ok(
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

  assert.ok(
    episodeResult.data?.episode,
    `File must correspond to a valid episode in ${item.fullTitle}`,
  );

  const { episode } = episodeResult.data;

  if (item.__typename === "Season") {
    assert.ok(
      episode.season.number === item.number,
      `File must correspond to a valid episode in ${item.fullTitle}`,
    );
  }

  if (item.__typename === "Episode") {
    assert.ok(
      episode.number === item.number &&
        episode.season.number === item.season.number,
      `Incorrect episode for ${item.fullTitle}`,
    );

    if (item.runtime && settings.minimumAverageBitrateEpisodes) {
      const bitrate = calculateAverageBitrate(file.size, item.runtime);

      assert.ok(
        bitrate >= settings.minimumAverageBitrateEpisodes,
        `File bitrate is ${bitrate.toString()}, under the configured minimum bitrate of ${settings.minimumAverageBitrateEpisodes.toString()} for episodes`,
      );
    }
  }

  return episode.id;
}

async function getValidEpisodeFiles(
  item: ShowLikeValidateTorrentFilesItem,
  groupMap: Map<string, TorrentFile>,
  isCacheCheck: boolean,
) {
  const validFiles: MatchedFile[] = [];
  const fileSource = isCacheCheck ? "cached files" : "torrent files";

  for (const lookupKey of getLookupKeys(item)) {
    const file = groupMap.get(lookupKey);

    if (!file) {
      continue;
    }

    logger.debug(
      `Found match in ${fileSource}: ${chalk.bold(file.name)} for item ${chalk.bold(item.fullTitle)} using lookup key '${chalk.bold(lookupKey)}'`,
    );

    try {
      const matchedEpisodeId = await getMatchedEpisodeId(item, file);

      validFiles.push(
        MatchedFile.parse({
          ...file,
          matchedMediaItemId: matchedEpisodeId,
          isCachedFile: isCacheCheck,
        }),
      );
    } catch (error) {
      logFileValidationFailure(file, error);
    }
  }

  return validFiles;
}

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
    const isMovie = item.__typename === "Movie";

    logger.verbose(
      `Validating torrent files for item ${chalk.bold(item.fullTitle)}: ${chalk.bold(infoHash)}`,
    );

    const groupMap = new Map(Object.entries(isMovie ? movies : episodes));

    const itemTypeLabel =
      item.type.slice(0, 1).toUpperCase() + item.type.slice(1);
    const fileTypeLabel = isMovie ? "movies" : "episodes";

    assert.ok(
      groupMap.size >= item.expectedFileCount,
      `${itemTypeLabel} torrent must have at least ${item.expectedFileCount.toString()} ${fileTypeLabel}, but has ${groupMap.size.toString()}`,
    );

    const validFiles =
      item.__typename === "Movie"
        ? getValidMovieFiles(item, itemId, groupMap, isCacheCheck)
        : await getValidEpisodeFiles(item, groupMap, isCacheCheck);

    assert.ok(
      item.expectedFileCount <= validFiles.length,
      `Expected at least ${item.expectedFileCount.toString()} valid files, but found ${validFiles.length.toString()}`,
    );

    return validFiles;
  } catch (error) {
    logger.verbose(`Torrent files are invalid for ${chalk.bold(infoHash)}`);

    if (error instanceof AssertionError) {
      throw new InvalidTorrentError(error.message);
    }

    throw error;
  }
};
