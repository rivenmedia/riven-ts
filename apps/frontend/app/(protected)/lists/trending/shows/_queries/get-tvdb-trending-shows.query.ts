import { gql } from "@apollo/client";

import type {
  GetFilteredTvdbTrendingShowsQuery,
  GetFilteredTvdbTrendingShowsQueryVariables,
} from "./get-tvdb-trending-shows.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_FILTERED_TVDB_TRENDING_SHOWS: TypedDocumentNode<
  GetFilteredTvdbTrendingShowsQuery,
  GetFilteredTvdbTrendingShowsQueryVariables
> = gql`
  query GetFilteredTvdbTrendingShows($page: Int!) {
    tvdbTrendingShows(timeWindow: "day", page: $page) {
      id
      title
      overview
      posterUrl
      releaseDate
      type
    }
  }
`;
