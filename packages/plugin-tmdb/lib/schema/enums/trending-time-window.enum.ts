import { registerEnumType } from "type-graphql";

import { trendingMoviesPathParamsSchema } from "#__generated__/zod/trendingMoviesSchema.ts";

import type { z } from "zod";

export const TmdbTrendingMoviesTimeWindow =
  trendingMoviesPathParamsSchema.shape.time_window.unwrap();

export type TmdbTrendingMoviesTimeWindow = z.infer<
  typeof TmdbTrendingMoviesTimeWindow
>;

registerEnumType(TmdbTrendingMoviesTimeWindow.enum, {
  name: "TMDBTrendingMoviesTimeWindow",
});
