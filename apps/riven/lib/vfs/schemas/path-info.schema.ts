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

type PathGroups = z.infer<typeof pathGroupsSchema>;

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
