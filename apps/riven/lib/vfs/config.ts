import { MediaItemType } from "@repo/util-plugin-sdk/dto/entities/index";

export const childQueryType = {
  movies: MediaItemType.enum.Movie,
  shows: MediaItemType.enum.Episode,
} satisfies Record<string, MediaItemType>;

export const ROOT_PATH = "/";

export const TRASH_PATH = "/.trash";

export const HIDDEN_PATH = ".hidden";
