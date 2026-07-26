import z from "zod";

export const PersistentDirectory = z.enum(["movies", "shows"]);

export type PersistentDirectory = z.infer<typeof PersistentDirectory>;

/** The namespace directory each media type lives under. */
export const NAMESPACE_BY_MEDIA_TYPE = {
  movie: "movies",
  show: "shows",
} as const satisfies Record<string, PersistentDirectory>;

export const MEDIA_TYPE_BY_NAMESPACE = {
  movies: "movie",
  shows: "show",
} as const satisfies Record<PersistentDirectory, string>;
