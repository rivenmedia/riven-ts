import { type } from "arktype";
import path from "node:path";

const PATH_PATTERN =
  /^\/(?<type>movies|shows)(\/(?<title>[^/]+)(\/Season (?<season>\d{2})?)?)?/;

const TMDB_ID_PATTERN = /\{tmdb-(?<tmdbId>\d+)\}/;
const TVDB_ID_PATTERN = /\{tvdb-(?<tvdbId>\d+)\}/;
const EPISODE_PATTERN = /s\d{2}e(?<episode>\d{2})/;

const pathGroupsSchema = type({
  type: type.enumerated("movies", "shows"),
  "title?": "string",
  "season?": "number",
});

const episodeGroupsSchema = type({
  episode: type("number | string.integer.parse"),
});

type PathGroups = typeof pathGroupsSchema.infer;

const determinePathType = (
  pathGroups: PathGroups,
  episode: number | undefined,
  tvdbId: string | undefined,
  tmdbId: string | undefined,
) => {
  if (pathGroups.type === "movies") {
    return tmdbId ? ("single-movie" as const) : ("all-movies" as const);
  }

  if (tvdbId && !pathGroups.season) {
    return "show-seasons" as const;
  }

  if (tvdbId && pathGroups.season && !episode) {
    return "season-episodes" as const;
  }

  if (tvdbId && pathGroups.season && episode) {
    return "single-episode" as const;
  }

  return "all-shows" as const;
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
        ),
      };
    }),
  );

export type PathInfo = z.infer<typeof PathInfo>;
