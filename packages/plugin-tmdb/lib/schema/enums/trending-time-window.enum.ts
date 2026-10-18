import { registerEnumType } from "type-graphql";

import { trendingMoviesPathParamsSchema } from "../../__generated__/zod/trendingMoviesSchema.ts";

import type { z } from "zod";

/**
 * The time window for TMDB trending endpoints.
 */
export const TmdbTrendingTimeWindow =
  trendingMoviesPathParamsSchema.shape.time_window.unwrap();

export type TmdbTrendingTimeWindow = z.infer<typeof TmdbTrendingTimeWindow>;

registerEnumType(TmdbTrendingTimeWindow.enum, {
  name: "TMDBTrendingTimeWindow",
});
