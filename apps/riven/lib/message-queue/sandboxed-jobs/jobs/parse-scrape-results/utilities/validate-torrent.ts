import { gql } from "@apollo/client";

import { client } from "../../../../../graphql/apollo-client.ts";

import type {
  EpisodeFieldsFragment,
  GetValidateTorrentItemQuery,
  GetValidateTorrentItemQueryVariables,
} from "./validate-torrent.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { ParsedData } from "@repo/util-rank-torrent-name";
import type { UUID } from "node:crypto";

export class SkippedTorrentError extends Error {
  public constructor(
    message: string,
    itemTitle: string,
    torrentTitle: string,
    torrentHash: string,
  ) {
    super(`[${itemTitle} | ${torrentTitle}]: ${message} (${torrentHash})`);

    this.name = "SkippedTorrentError";
  }
}

/**
 * Given a base year, return a list of candidate years that are valid for that base year.
 *
 * This is used to allow for some flexibility in torrent naming, where the year in the torrent title may be off by one year from the actual release year of the media item.
 *
 * @param year The base year to compare against
 * @returns A list of possible years that are valid for the base year
 */
const getYearCandidates = (year: number) => [year - 1, year, year + 1];

const EPISODE_FIELDS_FRAGMENT: TypedDocumentNode<EpisodeFieldsFragment> = gql`
  fragment EpisodeFields on Episode {
    absoluteNumber
    number
  }
`;

const GET_VALIDATE_TORRENT_ITEM_QUERY: TypedDocumentNode<
  GetValidateTorrentItemQuery,
  GetValidateTorrentItemQueryVariables
> = gql`
  query GetValidateTorrentItem($id: ID!) {
    mediaItemById(id: $id) {
      ... on Show {
        status
        seasons {
          number
          episodes {
            ...EpisodeFields
            id
          }
        }
      }

      ... on Season {
        number
        show {
          year
        }
        episodes {
          ...EpisodeFields
          id
        }
      }

      ... on Episode {
        ...EpisodeFields
        id
        season {
          number
          show {
            year
          }
        }
      }

      ... on MediaItem {
        id
        fullTitle
        country
        isAnime
        type
        year
      }
    }
  }

  ${EPISODE_FIELDS_FRAGMENT}
`;

function getEpisodeFieldsFragmentData(episode: {
  __typename: "Episode";
  id: string;
}) {
  const fragmentData = client.readFragment({
    fragment: EPISODE_FIELDS_FRAGMENT,
    id: client.cache.identify(episode),
  });

  if (!fragmentData) {
    throw new Error(
      `Failed to read episode fields fragment for episode with ID ${episode.id}`,
    );
  }

  return fragmentData;
}

type ValidateTorrentItem = NonNullable<
  GetValidateTorrentItemQuery["mediaItemById"]
>;

type ValidateTorrentItemOfType<T extends ValidateTorrentItem["__typename"]> =
  Extract<ValidateTorrentItem, { __typename: T }>;

type CreateSkippedTorrentError = (message: string) => SkippedTorrentError;

function getTopLevelItem(item: ValidateTorrentItem) {
  if (item.__typename === "Episode") {
    return item.season.show;
  }

  if (item.__typename === "Season") {
    return item.show;
  }

  return item;
}

function validateCountry(
  item: ValidateTorrentItem,
  parsedData: ParsedData,
  skip: CreateSkippedTorrentError,
) {
  if (
    parsedData.country &&
    item.country &&
    parsedData.country !== item.country &&
    !item.isAnime
  ) {
    throw skip("Skipping torrent with incorrect country");
  }
}

function validateYear(
  item: ValidateTorrentItem,
  parsedData: ParsedData,
  skip: CreateSkippedTorrentError,
) {
  if (!parsedData.year) {
    return;
  }

  const topLevelItem = getTopLevelItem(item);
  const candidateYears = new Set<number>();

  for (const baseYear of [item.year, topLevelItem.year]) {
    if (!baseYear) {
      continue;
    }

    for (const year of getYearCandidates(baseYear)) {
      candidateYears.add(year);
    }
  }

  if (candidateYears.size > 0 && !candidateYears.has(parsedData.year)) {
    throw skip("Skipping torrent with incorrect year");
  }
}

function validateMediaType(
  item: ValidateTorrentItem,
  parsedData: ParsedData,
  skip: CreateSkippedTorrentError,
) {
  const hasSeasonsOrEpisodes =
    parsedData.seasons.length > 0 || parsedData.episodes.length > 0;

  if (item.__typename === "Movie") {
    if (hasSeasonsOrEpisodes) {
      throw skip("Skipping show torrent for movie");
    }

    return;
  }

  if (!hasSeasonsOrEpisodes) {
    throw skip(
      `Skipping torrent with no seasons or episodes for ${item.type} item`,
    );
  }
}

function validateShow(
  item: ValidateTorrentItemOfType<"Show">,
  parsedData: ParsedData,
  skip: CreateSkippedTorrentError,
) {
  if (parsedData.seasons.length > 0) {
    const seasonsIntersection = new Set(parsedData.seasons).intersection(
      new Set(item.seasons.map((season) => season.number)),
    );

    const expectedSeasonCount =
      item.status === "ended" ? item.seasons.length : item.seasons.length - 1;

    if (seasonsIntersection.size < expectedSeasonCount) {
      throw skip("Skipping torrent with incorrect number of seasons");
    }
  }

  if (
    parsedData.episodes.length > 0 &&
    item.seasons.length === 1 &&
    item.seasons[0]?.episodes.length
  ) {
    const [{ episodes }] = item.seasons;

    const episodesIntersection = new Set(parsedData.episodes).intersection(
      new Set(
        episodes.map(
          (episode) => getEpisodeFieldsFragmentData(episode).absoluteNumber,
        ),
      ),
    );

    if (episodesIntersection.size !== episodes.length) {
      throw skip(
        "Skipping torrent with incorrect number of episodes for single-season show",
      );
    }
  }
}

function validateSeason(
  item: ValidateTorrentItemOfType<"Season">,
  parsedData: ParsedData,
  skip: CreateSkippedTorrentError,
) {
  if (parsedData.seasons.length === 0) {
    if (parsedData.episodes.length === 0) {
      return;
    }

    // If we don't have seasons, check that each *absolute* number is found in the list.
    // Some items name torrents using absolute episodes only (e.g. One Piece 0001-1000)
    const absoluteEpisodesIntersection = new Set(
      parsedData.episodes,
    ).intersection(
      new Set(
        item.episodes.map(
          (episode) => getEpisodeFieldsFragmentData(episode).absoluteNumber,
        ),
      ),
    );

    if (absoluteEpisodesIntersection.size !== item.episodes.length) {
      throw skip(
        "Skipping torrent with incorrect absolute episode range for season item",
      );
    }

    return;
  }

  if (!parsedData.seasons.includes(item.number)) {
    throw skip("Skipping torrent with incorrect season number for season item");
  }

  if (parsedData.episodes.length > 0) {
    // If we have seasons and episodes, check that each *relative* number is found in the list
    const relativeEpisodesIntersection = new Set(
      parsedData.episodes,
    ).intersection(
      new Set(
        item.episodes.map(
          (episode) => getEpisodeFieldsFragmentData(episode).number,
        ),
      ),
    );

    if (relativeEpisodesIntersection.size !== item.episodes.length) {
      throw skip("Skipping torrent with incorrect episodes for season item");
    }
  }
}

function validateEpisode(
  item: ValidateTorrentItemOfType<"Episode">,
  parsedData: ParsedData,
  skip: CreateSkippedTorrentError,
) {
  const fragmentData = getEpisodeFieldsFragmentData(item);

  const episodesIntersection = new Set(parsedData.episodes).intersection(
    new Set([fragmentData.number, fragmentData.absoluteNumber]),
  );

  const hasEpisodes = parsedData.episodes.length > 0;
  const hasSeasons = parsedData.seasons.length > 0;

  if (hasEpisodes && episodesIntersection.size === 0) {
    throw skip(
      "Skipping torrent with incorrect episode number for episode item",
    );
  }

  if (hasSeasons && !parsedData.seasons.includes(item.season.number)) {
    throw skip(
      "Skipping torrent with incorrect season number for episode item",
    );
  }

  if (!hasEpisodes && !hasSeasons) {
    throw skip("Skipping torrent with no seasons or episodes for episode item");
  }
}

export const validateTorrent = async (
  itemId: UUID,
  parsedData: ParsedData,
  infoHash: string,
) => {
  const itemResult = await client.query({
    query: GET_VALIDATE_TORRENT_ITEM_QUERY,
    variables: { id: itemId },
  });

  if (!itemResult.data?.mediaItemById) {
    throw new Error(`Media item with ID ${itemId} not found`);
  }

  const item = itemResult.data.mediaItemById;

  const skip: CreateSkippedTorrentError = (message) =>
    new SkippedTorrentError(
      message,
      item.fullTitle,
      parsedData.rawTitle,
      infoHash,
    );

  validateCountry(item, parsedData, skip);
  validateYear(item, parsedData, skip);
  validateMediaType(item, parsedData, skip);

  switch (item.__typename) {
    case "Show": {
      validateShow(item, parsedData, skip);

      break;
    }
    case "Season": {
      validateSeason(item, parsedData, skip);

      break;
    }
    case "Episode": {
      validateEpisode(item, parsedData, skip);

      break;
    }
    case "Movie":
  }
};
