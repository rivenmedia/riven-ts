import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import { wrap } from "@mikro-orm/core";

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

export const validateTorrent = async (
  item: MediaItem,
  itemTitle: string,
  parsedData: ParsedData,
  infoHash: string,
) => {
  if (
    parsedData.country &&
    item.country &&
    parsedData.country !== item.country &&
    !item.isAnime
  ) {
    throw new SkippedTorrentError(
      "Skipping torrent with incorrect country",
      itemTitle,
      parsedData.rawTitle,
      infoHash,
    );
  }

  const topLevelItem =
    item instanceof ShowLikeMediaItem ? await item.getShow() : item;

  const isIncorrectTopLevelItemYear =
    topLevelItem.year && parsedData.year
      ? !getYearCandidates(topLevelItem.year).includes(parsedData.year)
      : false;

  const isIncorrectItemYear =
    item.year && parsedData.year
      ? !getYearCandidates(item.year).includes(parsedData.year)
      : false;

  if (
    parsedData.year &&
    item.year &&
    isIncorrectItemYear &&
    isIncorrectTopLevelItemYear
  ) {
    throw new SkippedTorrentError(
      "Skipping torrent with incorrect year",
      itemTitle,
      parsedData.rawTitle,
      infoHash,
    );
  }

  if (item instanceof Movie) {
    if (parsedData.seasons.length || parsedData.episodes.length) {
      throw new SkippedTorrentError(
        "Skipping show torrent for movie",
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  }

  if (item instanceof ShowLikeMediaItem) {
    if (parsedData.seasons.length === 0 && parsedData.episodes.length === 0) {
      throw new SkippedTorrentError(
        `Skipping torrent with no seasons or episodes for ${item.type} item`,
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  }

  if (item instanceof Show) {
    await wrap(item).populate(["seasons"]);

    if (parsedData.seasons.length) {
      const seasonsIntersection = new Set(parsedData.seasons).intersection(
        new Set(item.seasons.map((season) => season.number)),
      );

      const expectedSeasonCount =
        item.status === "ended" ? item.seasons.length : item.seasons.length - 1;

      if (seasonsIntersection.size < expectedSeasonCount) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect number of seasons",
          itemTitle,
          parsedData.rawTitle,
          infoHash,
        );
      }
    }

    await wrap(item).populate(["seasons.episodes"]);

    if (
      parsedData.episodes.length &&
      item.seasons.length === 1 &&
      item.seasons[0]?.episodes.count()
    ) {
      const { episodes } = item.seasons[0];

      const episodesIntersection = new Set(parsedData.episodes).intersection(
        new Set(episodes.map((episode) => episode.absoluteNumber)),
      );

      if (episodesIntersection.size !== episodes.length) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect number of episodes for single-season show",
          itemTitle,
          parsedData.rawTitle,
          infoHash,
        );
      }
    }
  }

  if (item instanceof Season) {
    await wrap(item).populate(["episodes"]);

    if (parsedData.seasons.length === 0) {
      if (parsedData.episodes.length) {
        // If we don't have seasons, check that each *absolute* number is found in the list.
        // Some items name torrents using absolute episodes only (e.g. One Piece 0001-1000)

        const episodes = item.episodes.getItems();
        const absoluteEpisodesIntersection = new Set(
          parsedData.episodes,
        ).intersection(
          new Set(episodes.map((episode) => episode.absoluteNumber)),
        );

        if (absoluteEpisodesIntersection.size !== episodes.length) {
          throw new SkippedTorrentError(
            "Skipping torrent with incorrect absolute episode range for season item",
            itemTitle,
            parsedData.rawTitle,
            infoHash,
          );
        }
      }
    } else {
      if (!parsedData.seasons.includes(item.number)) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect season number for season item",
          itemTitle,
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
            itemTitle,
            parsedData.rawTitle,
            infoHash,
          );
        }
      }
    }
  }

  if (item instanceof Episode) {
    await wrap(item).populate(["season"]);

    const episodesIntersection = new Set(parsedData.episodes).intersection(
      new Set([item.number, item.absoluteNumber]),
    );

    const hasEpisodes = parsedData.episodes.length > 0;
    const hasSeasons = parsedData.seasons.length > 0;

    if (hasEpisodes && episodesIntersection.size === 0) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect episode number for episode item",
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }

    if (
      hasSeasons &&
      !parsedData.seasons.includes(item.season.getProperty("number"))
    ) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect season number for episode item",
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }

    if (!hasEpisodes && !hasSeasons) {
      throw new SkippedTorrentError(
        "Skipping torrent with no seasons or episodes for episode item",
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }
  }
};
