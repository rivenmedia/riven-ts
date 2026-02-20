import {
  type MediaItem,
  Movie,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import type { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

export const validateTorrentContainer = (
  item: MediaItem,
  container: TorrentContainer,
) => {
  if (item instanceof Movie) {
    return container.files.length === 1;
  }

  if (item instanceof Show) {
    const totalEpisodesForShow = item.seasons.reduce(
      (acc, season) => acc + season.episodes.length,
      0,
    );

    return container.files.length === totalEpisodesForShow;
  }

  return true;
};
