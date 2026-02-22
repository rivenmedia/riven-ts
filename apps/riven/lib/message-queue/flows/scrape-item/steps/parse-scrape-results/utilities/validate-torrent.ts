import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { wrap } from "@mikro-orm/core";

import { settings } from "../../../../../../utilities/settings.ts";

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

  if (
    parsedData.year &&
    item.year &&
    ![item.year - 1, item.year, item.year + 1].includes(parsedData.year)
  ) {
    throw new SkippedTorrentError(
      "Skipping torrent with incorrect year",
      itemTitle,
      parsedData.rawTitle,
      infoHash,
    );
  }

  // if (item.isAnime && settings.dubbedAnimeOnly && !parsedData.dubbed) {
  //   throw new SkippedTorrentError(
  //     "Skipping non-dubbed anime torrent",
  //     itemTitle,
  //     parsedData.rawTitle,
  //     infoHash,
  //   );
  // }

  if (item instanceof Movie) {
    if (parsedData.seasons.length || parsedData.episodes.length) {
      throw new SkippedTorrentError(
        `Skipping show torrent for movie`,
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

    if (
      parsedData.episodes.length &&
      item.seasons.length === 1 &&
      item.seasons[0]?.episodes.count()
    ) {
      await wrap(item).populate(["seasons.episodes"]);

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
    if (!parsedData.seasons.length) {
      throw new SkippedTorrentError(
        "Skipping torrent with no seasons for season item",
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }

    if (!parsedData.seasons.includes(item.number)) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect season number for season item",
        itemTitle,
        parsedData.rawTitle,
        infoHash,
      );
    }

    if (parsedData.episodes.length) {
      if (parsedData.episodes.length <= 2) {
        throw new SkippedTorrentError(
          "Skipping torrent with 2 or fewer episodes for season item",
          itemTitle,
          parsedData.rawTitle,
          infoHash,
        );
      }

      await wrap(item).populate(["episodes"]);

      const episodesIntersection = new Set(parsedData.episodes).intersection(
        new Set(
          item.episodes
            .map((episode) => [episode.number, episode.absoluteNumber])
            .flat(),
        ),
      );

      if (episodesIntersection.size !== item.episodes.length) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect episodes for season item",
          itemTitle,
          parsedData.rawTitle,
          infoHash,
        );
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
