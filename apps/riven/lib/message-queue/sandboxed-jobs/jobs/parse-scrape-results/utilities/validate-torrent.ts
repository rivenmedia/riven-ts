import { type TypedDocumentNode, gql } from "@apollo/client";

import { client } from "../../../../../graphql/apollo-client.ts";

import type {
  GetValidateTorrentItemQuery,
  GetValidateTorrentItemQueryVariables,
} from "./validate-torrent.typegen.ts";
import type { ParsedData } from "@repo/util-rank-torrent-name";

export class SkippedTorrentError extends Error {
  constructor(
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

const GET_VALIDATE_TORRENT_ITEM_QUERY: TypedDocumentNode<
  GetValidateTorrentItemQuery,
  GetValidateTorrentItemQueryVariables
> = gql`
  query GetValidateTorrentItem($id: Int!) {
    mediaItem(id: $id) {
      ... on Show {
        status
        seasons {
          number
          episodes {
            ...EpisodeFields
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
        }
      }

      ... on Episode {
        ...EpisodeFields
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

  fragment EpisodeFields on Episode {
    absoluteNumber
    number
  }
`;

export const validateTorrent = async (
  itemId: number,
  parsedData: ParsedData,
  infoHash: string,
) => {
  const itemResult = await client.query({
    query: GET_VALIDATE_TORRENT_ITEM_QUERY,
    variables: { id: itemId },
  });

  if (!itemResult.data?.mediaItem) {
    throw new Error(`Media item with ID ${itemId.toString()} not found`);
  }

  const item = itemResult.data.mediaItem;

  if (
    parsedData.country &&
    item.country &&
    parsedData.country !== item.country &&
    !item.isAnime
  ) {
    throw new SkippedTorrentError(
      "Skipping torrent with incorrect country",
      item.fullTitle,
      parsedData.rawTitle,
      infoHash,
    );
  }

  if (parsedData.year) {
    const topLevelItem =
      item.__typename === "Episode"
        ? item.season.show
        : item.__typename === "Season"
          ? item.show
          : item;

    const candidateYears = new Set<number>();

    if (item.year) {
      getYearCandidates(item.year).forEach((year) => candidateYears.add(year));
    }

    if (topLevelItem.year) {
      getYearCandidates(topLevelItem.year).forEach((year) =>
        candidateYears.add(year),
      );
    }

    if (candidateYears.size && !candidateYears.has(parsedData.year)) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect year",
        item.fullTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  }

  if (item.__typename === "Movie") {
    if (parsedData.seasons.length || parsedData.episodes.length) {
      throw new SkippedTorrentError(
        "Skipping show torrent for movie",
        item.fullTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  } else {
    if (parsedData.seasons.length === 0 && parsedData.episodes.length === 0) {
      throw new SkippedTorrentError(
        `Skipping torrent with no seasons or episodes for ${item.type} item`,
        item.fullTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  }

  if (item.__typename === "Show") {
    if (parsedData.seasons.length) {
      const seasonsIntersection = new Set(parsedData.seasons).intersection(
        new Set(item.seasons.map((season) => season.number)),
      );

      const expectedSeasonCount =
        item.status === "ended" ? item.seasons.length : item.seasons.length - 1;

      if (seasonsIntersection.size < expectedSeasonCount) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect number of seasons",
          item.fullTitle,
          parsedData.rawTitle,
          infoHash,
        );
      }
    }

    if (
      parsedData.episodes.length &&
      item.seasons.length === 1 &&
      item.seasons[0]?.episodes.length
    ) {
      const { episodes } = item.seasons[0];

      const episodesIntersection = new Set(parsedData.episodes).intersection(
        new Set(episodes.map((episode) => episode.absoluteNumber)),
      );

      if (episodesIntersection.size !== episodes.length) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect number of episodes for single-season show",
          item.fullTitle,
          parsedData.rawTitle,
          infoHash,
        );
      }
    }
  }

  if (item.__typename === "Season") {
    if (parsedData.seasons.length === 0) {
      if (parsedData.episodes.length) {
        // If we don't have seasons, check that each *absolute* number is found in the list.
        // Some items name torrents using absolute episodes only (e.g. One Piece 0001-1000)

        const absoluteEpisodesIntersection = new Set(
          parsedData.episodes,
        ).intersection(
          new Set(item.episodes.map((episode) => episode.absoluteNumber)),
        );

        if (absoluteEpisodesIntersection.size !== item.episodes.length) {
          throw new SkippedTorrentError(
            "Skipping torrent with incorrect absolute episode range for season item",
            item.fullTitle,
            parsedData.rawTitle,
            infoHash,
          );
        }
      }
    } else {
      if (!parsedData.seasons.includes(item.number)) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect season number for season item",
          item.fullTitle,
          parsedData.rawTitle,
          infoHash,
        );
      }

      if (parsedData.episodes.length) {
        // If we have seasons and episodes, check that each *relative* number is found in the list
        const relativeEpisodesIntersection = new Set(
          parsedData.episodes,
        ).intersection(new Set(item.episodes.map((episode) => episode.number)));

        if (relativeEpisodesIntersection.size !== item.episodes.length) {
          throw new SkippedTorrentError(
            "Skipping torrent with incorrect episodes for season item",
            item.fullTitle,
            parsedData.rawTitle,
            infoHash,
          );
        }
      }
    }
  }

  if (item.__typename === "Episode") {
    const episodesIntersection = new Set(parsedData.episodes).intersection(
      new Set([item.number, item.absoluteNumber]),
    );

    const hasEpisodes = parsedData.episodes.length > 0;
    const hasSeasons = parsedData.seasons.length > 0;

    if (hasEpisodes && episodesIntersection.size === 0) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect episode number for episode item",
        item.fullTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }

    if (hasSeasons && !parsedData.seasons.includes(item.season.number)) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect season number for episode item",
        item.fullTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }

    if (!hasEpisodes && !hasSeasons) {
      throw new SkippedTorrentError(
        "Skipping torrent with no seasons or episodes for episode item",
        item.fullTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  }
};
