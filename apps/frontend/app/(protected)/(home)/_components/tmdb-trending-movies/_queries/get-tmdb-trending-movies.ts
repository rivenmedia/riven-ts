import { gql } from "@apollo/client";

import type {
  GetTmdbTrendingMoviesQuery,
  GetTmdbTrendingMoviesQueryVariables,
} from "./get-tmdb-trending-movies.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TMDB_TRENDING_MOVIES: TypedDocumentNode<
  GetTmdbTrendingMoviesQuery,
  GetTmdbTrendingMoviesQueryVariables
> = gql`
  query GetTmdbTrendingMovies($timeWindow: String = "day") {
    tmdbTrendingMovies(timeWindow: $timeWindow) {
      id
      title
      posterPath
      type
      year
    }
  }
`;
