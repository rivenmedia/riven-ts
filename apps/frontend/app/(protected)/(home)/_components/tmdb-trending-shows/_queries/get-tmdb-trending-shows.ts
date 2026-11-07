import { gql } from "@apollo/client";

import type {
  GetTmdbTrendingShowsQuery,
  GetTmdbTrendingShowsQueryVariables,
} from "./get-tmdb-trending-shows.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TMDB_TRENDING_SHOWS: TypedDocumentNode<
  GetTmdbTrendingShowsQuery,
  GetTmdbTrendingShowsQueryVariables
> = gql`
  query GetTmdbTrendingShows($timeWindow: TMDBTrendingTimeWindow!) {
    tmdbTrendingShows(timeWindow: $timeWindow) {
      id
      title
      posterUrl
      type
      year
      isRequestable
    }
  }
`;
