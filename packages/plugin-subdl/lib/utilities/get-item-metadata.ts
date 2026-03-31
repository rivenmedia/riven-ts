import {
  Episode,
  type MediaItem,
  Movie,
} from "@repo/util-plugin-sdk/dto/entities";

interface ItemMetadata {
  type: "movie" | "tv";
  tmdbId: string | undefined;
  imdbId: string | undefined;
  seasonNumber: number | undefined;
  episodeNumber: number | undefined;
}

export function getItemMetadata(item: MediaItem): ItemMetadata | null {
  if (item instanceof Movie) {
    return {
      type: "movie",
      tmdbId: item.tmdbId,
      imdbId: item.imdbId ?? undefined,
      seasonNumber: undefined,
      episodeNumber: undefined,
    };
  }

  if (item instanceof Episode) {
    return {
      type: "tv",
      tmdbId: undefined,
      imdbId: item.imdbId ?? undefined,
      seasonNumber: item.season.getProperty("number"),
      episodeNumber: item.number,
    };
  }

  return null;
}
