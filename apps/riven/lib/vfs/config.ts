import { MediaItemType } from "@repo/util-plugin-sdk/dto/entities/index";

export const childQueryType = {
  movies: MediaItemType.enum.movie,
  shows: MediaItemType.enum.episode,
} satisfies Record<string, MediaItemType>;

export const ROOT_PATH = "/";

export const CHUNK_SIZE = 1024 * 1024;
