import { MediaItemType } from "@repo/util-plugin-sdk/dto/entities/index";

import path from "node:path";
import z from "zod";

export const persistentDirs = z.enum(["movies", "shows"]);

export const childQueryType = {
  movies: MediaItemType.enum.Movie,
  shows: MediaItemType.enum.Episode,
} satisfies Record<string, MediaItemType>;

export const ROOT_PATH = "/";

export const TRASH_PATH = "/.trash";

export const HIDDEN_PATH = ".hidden";

const PATH_PATTERN =
  /^\/(?<type>movies|shows)(\/(?<title>[^/]+)(\/(?<season>S\d{2})(\/(?<episode>E\d{2}))?)?)?/;

const pathGroupsSchema = z.object({
  type: z.enum(["movies", "shows"]),
  title: z.string().optional(),
  season: z.string().optional(),
  episode: z.string().optional(),
});

export const pathSchema = z
  .string()
  .regex(PATH_PATTERN)
  .pipe(
    z.transform((val) => {
      const pathGroups = pathGroupsSchema.parse(PATH_PATTERN.exec(val)?.groups);
      const pathInfo = path.parse(val);

      return {
        ...pathGroups,
        ...pathInfo,
        isFile: pathInfo.ext !== "",
      };
    }),
  );
