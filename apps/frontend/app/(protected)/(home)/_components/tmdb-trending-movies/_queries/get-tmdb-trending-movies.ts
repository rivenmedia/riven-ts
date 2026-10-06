import { gql } from "@apollo/client";

import type {
  GetTmdbTrendingMoviesQuery,
  GetTmdbTrendingMoviesQueryVariables,
} from "./get-tmdb-trending-movies.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TMDB_TRENDING_MOVIES: TypedDocumentNode<
  GetTmdbTrendingMoviesQuery,
  GetTmdbTrendingMoviesQueryVariables
> = gql`
  query GetTmdbTrendingMovies($timeWindow: TMDBTrendingMoviesTimeWindow!) {
    tmdbTrendingMovies(timeWindow: $timeWindow) {
      id
      title
      posterUrl
      type
      year
    }
  }
`;
