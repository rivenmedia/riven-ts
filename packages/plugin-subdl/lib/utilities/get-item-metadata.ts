import {
  Episode,
  type MediaItem,
  Movie,
} from "@repo/util-plugin-sdk/dto/entities";

export function getItemMetadata(item: MediaItem) {
  if (item instanceof Movie) {
    return {
      type: "movie",
      tmdbId: item.tmdbId,
      imdbId: item.imdbId ?? undefined,
    };
  }

  if (item instanceof Episode) {
    return {
      type: "tv",
      imdbId: item.imdbId ?? undefined,
      seasonNumber: item.season.getProperty("number"),
      episodeNumber: item.number,
    };
  }

  return null;
}
