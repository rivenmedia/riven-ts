import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  Show,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { parse } from "@repo/util-rank-torrent-name";

import { reduceAsync } from "es-toolkit";
import assert, { AssertionError } from "node:assert";

import { database } from "../../../../../../database/database.ts";
import { logger } from "../../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../../utilities/settings.ts";
import { MatchedFile } from "../find-valid-torrent.schema.ts";

import type { MapItemsToFilesFlow } from "../../map-items-to-files/map-items-to-files.schema.ts";

export class InvalidTorrentError extends Error {}

async function getExpectedFileCount(item: MediaItem) {
  if (item instanceof Show) {
    const processableStates = MediaItemState.exclude(["unreleased", "ongoing"]);

    const seasons = await item.getStandardSeasons(processableStates.options);
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

async function getItemLookupKeys(item: ShowLikeMediaItem) {
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

  throw new Error("Movies do not have lookup keys");
}

function calculateAverageBitrate(fileSize: number, runtime: number) {
  return fileSize / runtime / (1024 * 1024);
}

export const validateTorrentFiles = async (
  item: MediaItem,
  infoHash: string,
  { episodes, movies }: MapItemsToFilesFlow["output"],
  isCacheCheck: boolean,
): Promise<MatchedFile[]> => {
  try {
    logger.verbose(
      `Validating torrent files for item ${item.fullTitle}: ${infoHash}`,
    );

    const expectedFileCount = await getExpectedFileCount(item);

    const groupMap = new Map(
      Object.entries(item instanceof ShowLikeMediaItem ? episodes : movies),
    );

    assert(
      groupMap.size >= expectedFileCount,
      `${item.type.substring(0, 1).toUpperCase() + item.type.substring(1)} torrent must have at least ${expectedFileCount.toString()} ${item instanceof ShowLikeMediaItem ? "episodes" : "movies"}, but has ${groupMap.size.toString()}`,
    );

    const validFiles: MatchedFile[] = [];

    if (item instanceof Movie) {
      const files = groupMap
        .values()
        .toArray()
        .sort((a, b) => b.size - a.size);

      for (const file of files) {
        try {
          const parseData = parse(file.name);

          assert(parseData.type === "movie", "File must be a movie");

          if (item.runtime && settings.minimumAverageBitrateMovies) {
            const bitrate = calculateAverageBitrate(file.size, item.runtime);

            assert(
              bitrate >= settings.minimumAverageBitrateMovies,
              `File bitrate is ${bitrate.toString()}, under the configured minimum bitrate of ${settings.minimumAverageBitrateMovies.toString()} for movies`,
            );
          }

          validFiles.push(
            MatchedFile.encode({
              ...file,
              matchedMediaItemId: item.id,
              isCachedFile: isCacheCheck,
            }),
          );

          break;
        } catch (error) {
          logger.debug(
            `File ${file.name} failed validation: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    if (item instanceof ShowLikeMediaItem) {
      const lookupKeys = await getItemLookupKeys(item);

      for (const lookupKey of lookupKeys) {
        const file = groupMap.get(lookupKey);

        if (!file) {
          continue;
        }

        logger.debug(
          `Found match in ${isCacheCheck ? "cached files" : "torrent files"}: ${file.name} for item ${item.fullTitle} using lookup key '${lookupKey}'`,
        );

        try {
          const parseData = parse(file.name);

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

          const episodeSeasonNumber =
            await episode.season.loadProperty("number");

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

            if (item.runtime && settings.minimumAverageBitrateEpisodes) {
              const bitrate = calculateAverageBitrate(file.size, item.runtime);

              assert(
                bitrate >= settings.minimumAverageBitrateEpisodes,
                `File bitrate is ${bitrate.toString()}, under the configured minimum bitrate of ${settings.minimumAverageBitrateEpisodes.toString()} for episodes`,
              );
            }
          }

          validFiles.push(
            MatchedFile.encode({
              ...file,
              matchedMediaItemId: episode.id,
              isCachedFile: isCacheCheck,
            }),
          );
        } catch (error) {
          logger.debug(
            `File ${file.name} failed validation: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    assert(
      expectedFileCount <= validFiles.length,
      `Expected at least ${expectedFileCount.toString()} valid files, but found ${validFiles.length.toString()}`,
    );

    return validFiles;
  } catch (error) {
    if (error instanceof AssertionError) {
      throw new InvalidTorrentError(error.message);
    }

    throw error;
  }
};
