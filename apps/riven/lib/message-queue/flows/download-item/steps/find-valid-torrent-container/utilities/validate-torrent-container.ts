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

    assert(
      container.files.length === expectedEpisodes,
      `Show torrent container must have exactly ${expectedEpisodes.toString()} files, but has ${container.files.length.toString()}`,
    );
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
