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

import type { MatchedFile } from "../find-valid-torrent-container.schema.ts";
import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

export const validateTorrentContainer = async (
  item: MediaItem,
  container: TorrentContainer,
): Promise<MatchedFile[]> => {
  logger.verbose(
    `Validating torrent container for item ${item.fullTitle}: ${container.infoHash}`,
  );

  if (item instanceof Show) {
    const seasons = await item.seasons.loadItems();

    const expectedSeasons =
      item.status === "continuing" ? seasons.length - 1 : seasons.length;

    const expectedEpisodes = await reduceAsync(
      seasons.slice(0, Math.max(1, expectedSeasons)),
      async (acc, season) => acc + (await season.episodes.loadCount()),
      0,
    );

    assert(
      container.files.length >= expectedEpisodes,
      `Show torrent container must have at least ${expectedEpisodes.toString()} files, but has ${container.files.length.toString()}`,
    );
  }

  if (item instanceof Season) {
    const expectedEpisodes = await item.episodes.loadCount();

    assert(
      container.files.length >= expectedEpisodes,
      `Season torrent container must have at least ${expectedEpisodes.toString()} files, but has ${container.files.length.toString()}`,
    );
  }

  const validFiles: MatchedFile[] = [];

  for (const file of container.files) {
    try {
      assert(file.downloadUrl, `File ${file.fileName} has no download URL`);

      const fileData = parse(file.fileName);

      if (item instanceof Movie) {
        assert(fileData.type === "movie", "File must be a movie");

        validFiles.push({
          fileName: file.fileName,
          fileSize: file.fileSize,
          downloadUrl: file.downloadUrl,
          matchedMediaItemId: item.id,
          type: "movie",
        });
      }

      if (item instanceof ShowLikeMediaItem) {
        assert(fileData.type === "show", "File must be part of a show");

        assert(
          fileData.episodes[0],
          "File must have at least one episode number",
        );

        assert(
          fileData.seasons[0],
          "File must have at least one season number",
        );

        assert(
          !fileData.episodes.includes(0),
          "File must not have unknown episode numbers",
        );

        assert(
          !fileData.seasons.includes(0),
          "File must not have unknown season numbers",
        );

        const episode = await database.episode.findOne(
          {
            ...(item instanceof Episode ? { id: item.id } : {}),
            season: {
              ...(item instanceof Season ? { id: item.id } : {}),
              number: fileData.seasons[0],
              ...(item instanceof Show ? { show: { id: item.id } } : {}),
            },
            number: fileData.episodes[0],
          },
          { populate: ["$infer"] },
        );

        assert(
          episode,
          `File must correspond to a valid episode in ${item.fullTitle}`,
        );

        validFiles.push({
          fileName: file.fileName,
          fileSize: file.fileSize,
          downloadUrl: file.downloadUrl,
          matchedMediaItemId: item.id,
          type: "show",
          season: fileData.seasons[0],
          episode: fileData.episodes[0],
        });
      }
    } catch (error) {
      logger.warn(
        `File ${file.fileName} failed validation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  assert(
    validFiles.length > 0,
    `No valid files found in torrent container ${container.infoHash}`,
  );

  return validFiles;
};
