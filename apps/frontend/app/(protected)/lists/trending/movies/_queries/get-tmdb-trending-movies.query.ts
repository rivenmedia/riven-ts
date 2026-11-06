import { gql } from "@apollo/client";

import type {
  GetFilteredTmdbTrendingMoviesQuery,
  GetFilteredTmdbTrendingMoviesQueryVariables,
} from "./get-tmdb-trending-movies.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_FILTERED_TMDB_TRENDING_MOVIES: TypedDocumentNode<
  GetFilteredTmdbTrendingMoviesQuery,
  GetFilteredTmdbTrendingMoviesQueryVariables
> = gql`
  query GetFilteredTmdbTrendingMovies($page: Int!) {
    tmdbTrendingMovies(timeWindow: day, page: $page) {
      id
      title
      overview
      posterUrl
      releaseDate
      type
      year
    }
  }
`;
