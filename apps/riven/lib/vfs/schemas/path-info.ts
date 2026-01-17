import path from "node:path";
import z from "zod";

const PATH_PATTERN =
  /^\/(?<type>movies|shows)(\/(?<title>[^/]+)(\/(?<season>S\d{2})(\/(?<episode>E\d{2}))?)?)?/;

const TMDB_ID_PATTERN = /\{tmdb-(?<tmdbId>\d+)\}/;

const pathGroupsSchema = z.object({
  type: z.enum(["movies", "shows"]),
  title: z.string().optional(),
  season: z.string().optional(),
  episode: z.string().optional(),
});

export const PathInfo = z
  .string()
  .regex(PATH_PATTERN)
  .pipe(
    z.transform((val) => {
      const pathGroups = pathGroupsSchema.parse(PATH_PATTERN.exec(val)?.groups);
      const tmdbId = TMDB_ID_PATTERN.exec(val)?.groups?.["tmdbId"];
      const pathInfo = path.parse(val);

      return {
        ...pathGroups,
        ...pathInfo,
        isFile: pathInfo.ext !== "",
        tmdbId,
      };
    }),
  );

export type PathInfo = z.infer<typeof PathInfo>;
