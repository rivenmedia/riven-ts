import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { wrap } from "@mikro-orm/core";

import { settings } from "../../../../../../utilities/settings.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

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
  torrent: RankedResult,
) => {
  if (item instanceof Movie) {
    if (torrent.data.seasons.length || torrent.data.episodes.length) {
      throw new SkippedTorrentError(
        `Skipping show torrent for movie`,
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }
  }

  if (item instanceof Show) {
    if (torrent.data.episodes.length && torrent.data.episodes.length <= 2) {
      throw new SkippedTorrentError(
        "Skipping torrent with 2 or fewer episodes for show",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }

    await wrap(item).populate(["seasons"]);

    const seasonsIntersection = new Set(torrent.data.seasons).intersection(
      new Set(item.seasons.map((season) => season.number)),
    );

    if (seasonsIntersection.size !== item.seasons.length) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect number of seasons",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }

    await wrap(item).populate(["seasons.episodes"]);

    if (
      torrent.data.episodes.length &&
      item.seasons.length === 1 &&
      item.seasons[0]?.episodes
    ) {
      const { episodes } = item.seasons[0];

      const episodesIntersection = new Set(torrent.data.episodes).intersection(
        new Set(episodes.map((episode) => episode.absoluteNumber)),
      );

      if (episodesIntersection.size !== episodes.length) {
        throw new SkippedTorrentError(
          "Skipping torrent with incorrect number of episodes for single-season show",
          itemTitle,
          torrent.data.rawTitle,
          torrent.hash,
        );
      }
    }
  }

  if (item instanceof Season) {
    if (!torrent.data.seasons.length) {
      throw new SkippedTorrentError(
        "Skipping torrent with no seasons for season item",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }

    if (!torrent.data.seasons.includes(item.number)) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect season number for season item",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }

    if (torrent.data.episodes.length) {
      if (torrent.data.episodes.length <= 2) {
        throw new SkippedTorrentError(
          "Skipping torrent with 2 or fewer episodes for season item",
          itemTitle,
          torrent.data.rawTitle,
          torrent.hash,
        );
      }

      await wrap(item).populate(["episodes"]);

      const episodesIntersection = new Set(torrent.data.episodes).intersection(
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
          torrent.data.rawTitle,
          torrent.hash,
        );
      }
    }
  }

  if (item instanceof Episode) {
    await wrap(item).populate(["season"]);

    const episodesIntersection = new Set(torrent.data.episodes).intersection(
      new Set([item.number, item.absoluteNumber]),
    );

    const hasEpisodes = torrent.data.episodes.length > 0;
    const hasSeasons = torrent.data.seasons.length > 0;

    if (hasEpisodes && episodesIntersection.size === 0) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect episode number for episode item",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }

    if (
      hasSeasons &&
      !torrent.data.seasons.includes(item.season.getProperty("number"))
    ) {
      throw new SkippedTorrentError(
        "Skipping torrent with incorrect season number for episode item",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }

    if (!hasEpisodes && !hasSeasons) {
      throw new SkippedTorrentError(
        "Skipping torrent with no seasons or episodes for episode item",
        itemTitle,
        torrent.data.rawTitle,
        torrent.hash,
      );
    }
  }

  if (
    torrent.data.country &&
    item.country &&
    torrent.data.country !== item.country &&
    !item.isAnime
  ) {
    throw new SkippedTorrentError(
      "Skipping torrent with incorrect country",
      itemTitle,
      torrent.data.rawTitle,
      torrent.hash,
    );
  }

  if (
    torrent.data.year &&
    item.year &&
    ![item.year - 1, item.year, item.year + 1].includes(torrent.data.year)
  ) {
    throw new SkippedTorrentError(
      "Skipping torrent with incorrect year",
      itemTitle,
      torrent.data.rawTitle,
      torrent.hash,
    );
  }

  if (item.isAnime && settings.dubbedAnimeOnly && !torrent.data.dubbed) {
    throw new SkippedTorrentError(
      "Skipping non-dubbed anime torrent",
      itemTitle,
      torrent.data.rawTitle,
      torrent.hash,
    );
  }
};
