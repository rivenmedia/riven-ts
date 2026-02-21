import {
  type MediaItem,
  Movie,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";
import { parse } from "@repo/util-rank-torrent-name";

import { reduceAsync } from "es-toolkit";
import assert from "node:assert";

import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

export const validateTorrentContainer = async (
  item: MediaItem,
  container: TorrentContainer,
) => {
  if (item instanceof Movie) {
    assert(
      container.files.length === 1,
      "Movie torrent container must have exactly 1 file",
    );
  }

  if (item instanceof ShowLikeMediaItem) {
    const show = await item.getShow();
    const seasons = await show.seasons.loadItems();

    const expectedSeasons =
      show.status === "continuing" ? seasons.length - 1 : seasons.length;

    const expectedEpisodes = await reduceAsync(
      seasons.slice(0, Math.max(1, expectedSeasons)),
      async (acc, season) => acc + (await season.episodes.loadCount()),
      0,
    );

    // some release packs contain extra videos
    const normalisedFiles = container.files
      .map((file) => ({
        file,
        parsed: parse(file.fileName),
      }))
      .filter(
        ({ parsed }) =>
          parsed.episodes.length > 0 &&
          !parsed.episodes.includes(0) &&
          !parsed.seasons.includes(0),
      )
      .map(({ file, parsed }) => ({
        file,
        season: parsed.seasons.find((season) => season > 0) ?? 0,
        episode: parsed.episodes.find((episode) => episode > 0) ?? 0,
      }))
      .toSorted((a, b) => {
        const bySeason = a.season - b.season;

        if (bySeason !== 0) {
          return bySeason;
        }

        const byEpisode = a.episode - b.episode;

        if (byEpisode !== 0) {
          return byEpisode;
        }

        return a.file.fileName.localeCompare(b.file.fileName);
      })
      .map(({ file }) => file);

    assert(
      normalisedFiles.length >= expectedEpisodes,
      `Show torrent container must have at least ${expectedEpisodes.toString()} episode files, but has ${normalisedFiles.length.toString()}`,
    );

    const selectedFiles = normalisedFiles.slice(0, expectedEpisodes);

    assert(selectedFiles.length > 0, "Show torrent container has no files");

    const [firstFile, ...restFiles] = selectedFiles;

    assert(firstFile, "Show torrent container has no files");

    container.files = [firstFile, ...restFiles];
  }

  for (const file of container.files) {
    const fileData = parse(file.fileName);

    if (item instanceof Movie) {
      assert(fileData.type === "movie", "File must be a movie");
    }

    if (item instanceof ShowLikeMediaItem) {
      assert(fileData.episodes.length, "File must have episode data");

      assert(
        !fileData.episodes.includes(0),
        "File must not have unknown episode numbers",
      );

      assert(
        !fileData.seasons.includes(0),
        "File must not have unknown season numbers",
      );
    }
  }

  return container;
};
