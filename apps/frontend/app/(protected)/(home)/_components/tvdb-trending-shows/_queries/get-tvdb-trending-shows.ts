import { gql } from "@apollo/client";

import type {
  GetTvdbTrendingShowsQuery,
  GetTvdbTrendingShowsQueryVariables,
} from "./get-tvdb-trending-shows.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_TVDB_TRENDING_SHOWS: TypedDocumentNode<
  GetTvdbTrendingShowsQuery,
  GetTvdbTrendingShowsQueryVariables
> = gql`
  query GetTvdbTrendingShows($timeWindow: String = "day") {
    tvdbTrendingShows(timeWindow: $timeWindow) {
      id
      title
      posterPath
      type
      year
    }
  }
`;
