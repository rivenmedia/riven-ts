import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";
import { parse } from "@repo/util-rank-torrent-name";

import { reduceAsync } from "es-toolkit";
import assert from "node:assert";

import { database } from "../../../../../../database/database.ts";

import type { MapItemsToFilesFlow } from "../../map-items-to-files/map-items-to-files.schema.ts";

async function getExpectedFileCount(item: MediaItem) {
  if (item instanceof Show) {
    const seasons = await item.seasons.loadItems();
    const seasonsExcludingSpecials = seasons.filter(
      ({ number }) => number !== 0,
    );

    const expectedSeasons =
      item.status === "continuing"
        ? seasonsExcludingSpecials.length - 1
        : seasonsExcludingSpecials.length;

    return reduceAsync(
      seasonsExcludingSpecials.slice(0, Math.max(1, expectedSeasons)),
      async (acc, season) => acc + (await season.episodes.loadCount()),
      0,
    );
  }

  if (item instanceof Season) {
    return item.episodes.loadCount();
  }

  return 1;
}

function getEpisodeLookupKeys(episode: Episode) {
  return [
    `abs:${episode.absoluteNumber.toString()}`,
    `${episode.season.unwrap().number.toString()}:${episode.number.toString()}`,
  ];
}

async function getItemLookupKeys(item: MediaItem) {
  if (item instanceof Show || item instanceof Season) {
    const episodes =
      item instanceof Show
        ? await item.getEpisodes()
        : item.episodes.getItems();

    return episodes.reduce<string[]>(
      (acc, episode) => [...acc, ...getEpisodeLookupKeys(episode)],
      [],
    );
  }

  if (item instanceof Episode) {
    return getEpisodeLookupKeys(item);
  }

  return ["0"];
}

export const validateCachedTorrentFiles = async (
  item: MediaItem,
  { episodes, movies }: MapItemsToFilesFlow["output"],
): Promise<void> => {
  const expectedFileCount = await getExpectedFileCount(item);

  const groupMap = new Map(
    Object.entries(item instanceof ShowLikeMediaItem ? episodes : movies),
  );

  assert(
    groupMap.size >= expectedFileCount,
    `${item.type.substring(0, 1).toUpperCase() + item.type.substring(1)} torrent container must have at least ${expectedFileCount.toString()} ${item instanceof ShowLikeMediaItem ? "episodes" : "movies"}, but has ${groupMap.size.toString()}`,
  );

  let validFileCount = 0;
  const lookupKeys = await getItemLookupKeys(item);

  for (const lookupKey of lookupKeys) {
    const file = groupMap.get(lookupKey);

    if (!file) {
      continue;
    }

    try {
      const parseData = parse(file.name);

      if (item instanceof Movie) {
        assert(parseData.type === "movie", "File must be a movie");

        validFileCount++;
      }

      if (item instanceof ShowLikeMediaItem) {
        assert(
          parseData.type === "show",
          "Expected an episode, but found a movie",
        );

        assert(
          parseData.episodes[0] != null,
          "File must have at least one episode number",
        );

        const episode = await database.episode.findAbsoluteEpisode(
          item.tvdbId,
          parseData.episodes[0],
          parseData.seasons[0],
        );

        assert(
          episode,
          `File must correspond to a valid episode in ${item.fullTitle}`,
        );

        const episodeSeasonNumber = await episode.season.loadProperty("number");

        if (item instanceof Season) {
          assert(
            episodeSeasonNumber === item.number,
            `File must correspond to a valid episode in ${item.fullTitle}`,
          );
        }

        if (item instanceof Episode) {
          const itemSeasonNumber = await item.season.loadProperty("number");

          assert(
            episode.number === item.number &&
              episodeSeasonNumber === itemSeasonNumber,
            `Incorrect episode for ${item.fullTitle}`,
          );
        }

        validFileCount++;
      }
    } catch {
      continue;
    }
  }

  assert(
    expectedFileCount <= validFileCount,
    `Expected at least ${expectedFileCount.toString()} valid files, but found ${validFileCount.toString()}`,
  );
};
