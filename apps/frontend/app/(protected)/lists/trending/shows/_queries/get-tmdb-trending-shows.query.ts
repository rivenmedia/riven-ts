import { gql } from "@apollo/client";

import type {
  GetFilteredTmdbTrendingShowsQuery,
  GetFilteredTmdbTrendingShowsQueryVariables,
} from "./get-tmdb-trending-shows.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_FILTERED_TMDB_TRENDING_SHOWS: TypedDocumentNode<
  GetFilteredTmdbTrendingShowsQuery,
  GetFilteredTmdbTrendingShowsQueryVariables
> = gql`
  query GetFilteredTmdbTrendingShows($page: Int!) {
    tmdbTrendingShows(timeWindow: day, page: $page) {
      id
      title
      overview
      posterUrl
      releaseDate
      type
      year
      isRequestable
    }
  }
`;
