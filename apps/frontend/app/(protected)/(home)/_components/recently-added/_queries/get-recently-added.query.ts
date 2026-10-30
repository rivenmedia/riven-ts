import { gql } from "@apollo/client";

import type {
  GetRecentlyAddedQuery,
  GetRecentlyAddedQueryVariables,
} from "./get-recently-added.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_RECENTLY_ADDED: TypedDocumentNode<
  GetRecentlyAddedQuery,
  GetRecentlyAddedQueryVariables
> = gql`
  query GetRecentlyAdded {
    recentlyAdded {
      ... on MediaItem {
        id
        title
        posterPath
        type
        year
      }
    }
  }
`;
