import path from "node:path";
import z from "zod";

const PATH_PATTERN =
  /^\/(?<type>movies|shows)(\/(?<title>[^/]+)(\/Season (?<season>\d{2})?)?)?/;

const TMDB_ID_PATTERN = /\{tmdb-(?<tmdbId>\d+)\}/;
const TVDB_ID_PATTERN = /\{tvdb-(?<tvdbId>\d+)\}/;
const EPISODE_PATTERN = /s\d{2}e(?<episode>\d{2})/;

const pathGroupsSchema = z.object({
  type: z.enum(["movies", "shows"]),
  title: z.string().optional(),
  season: z.coerce.number().optional(),
});

const episodeGroupsSchema = z.object({
  episode: z.coerce.number(),
});

const SubtitleFileExtension = z.enum([".srt"]);

type PathGroups = z.infer<typeof pathGroupsSchema>;

type PathType =
  | "all-movies"
  | "single-movie"
  | "all-shows"
  | "show-seasons"
  | "season-episodes"
  | "single-episode"
  | "subtitle-file";

const determinePathType = (
  pathGroups: PathGroups,
  episode: number | undefined,
  tvdbId: string | undefined,
  tmdbId: string | undefined,
  extension: string,
): PathType => {
  if (SubtitleFileExtension.safeParse(extension).success) {
    return "subtitle-file";
  }

  if (pathGroups.type === "movies") {
    return tmdbId ? "single-movie" : "all-movies";
  }

  if (tvdbId && !pathGroups.season) {
    return "show-seasons";
  }

  if (tvdbId && pathGroups.season && !episode) {
    return "season-episodes";
  }

  if (tvdbId && pathGroups.season && episode) {
    return "single-episode";
  }

  return "all-shows";
};

export const PathInfo = z
  .string()
  .regex(PATH_PATTERN)
  .pipe(
    z.transform((val) => {
      const pathGroups = pathGroupsSchema.parse(PATH_PATTERN.exec(val)?.groups);
      const episodeGroups = episodeGroupsSchema
        .optional()
        .parse(EPISODE_PATTERN.exec(val)?.groups);
      const tvdbId = TVDB_ID_PATTERN.exec(val)?.groups?.["tvdbId"];
      const tmdbId = TMDB_ID_PATTERN.exec(val)?.groups?.["tmdbId"];
      const pathInfo = path.parse(val);

      return {
        ...pathGroups,
        ...pathInfo,
        rawPath: val,
        season: pathGroups.season,
        episode: episodeGroups?.episode,
        isFile: pathInfo.ext !== "",
        tmdbId,
        tvdbId,
        pathType: determinePathType(
          pathGroups,
          episodeGroups?.episode,
          tvdbId,
          tmdbId,
          pathInfo.ext,
        ),
      };
    }),
  );

export type PathInfo = z.infer<typeof PathInfo>;
