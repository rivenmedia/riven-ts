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
import { logger } from "../../../../../../utilities/logger/logger.ts";

import type { MapItemsToFilesFlow } from "../../map-items-to-files/map-items-to-files.schema.ts";
import type { MatchedFile } from "../find-valid-torrent-container.schema.ts";

async function getExpectedFileCount(item: MediaItem) {
  if (item instanceof Show) {
    const seasons = await item.seasons.loadItems();

    const expectedSeasons =
      item.status === "continuing" ? seasons.length - 1 : seasons.length;

    return reduceAsync(
      seasons.slice(0, Math.max(1, expectedSeasons)),
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

export const validateTorrentFiles = async (
  item: MediaItem,
  infoHash: string,
  { episodes, movies }: MapItemsToFilesFlow["output"],
): Promise<MatchedFile[]> => {
  logger.verbose(
    `Validating torrent container for item ${item.fullTitle}: ${infoHash}`,
  );

  const expectedFileCount = await getExpectedFileCount(item);

  const group = item instanceof ShowLikeMediaItem ? episodes : movies;

  const groupMap = new Map(Object.entries(group));

  assert(
    groupMap.size >= expectedFileCount,
    `${item.type.substring(0, 1).toUpperCase() + item.type.substring(1)} torrent container must have at least ${expectedFileCount.toString()} ${item instanceof ShowLikeMediaItem ? "episodes" : "movies"}, but has ${groupMap.size.toString()}`,
  );

  const validFiles: MatchedFile[] = [];
  const lookupKeys = await getItemLookupKeys(item);

  for (const lookupKey of lookupKeys) {
    const file = groupMap.get(lookupKey);

    if (!file) {
      continue;
    }

    logger.debug(
      `Found match: ${file.name} for item ${item.fullTitle} using lookup key '${lookupKey}'`,
    );

    try {
      assert(file.link, `File ${file.name} has no download URL`);

      const parseData = parse(file.name);

      if (item instanceof Movie) {
        assert(parseData.type === "movie", "File must be a movie");

        validFiles.push({
          ...file,
          link: file.link,
          matchedMediaItemId: item.id,
        });
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

        validFiles.push({
          ...file,
          link: file.link,
          matchedMediaItemId: episode.id,
        });
      }
    } catch (error) {
      logger.debug(
        `File ${file.name} failed validation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  assert(
    expectedFileCount === validFiles.length,
    `Expected ${expectedFileCount.toString()} valid files, but found ${validFiles.length.toString()}`,
  );

  return validFiles;
};
