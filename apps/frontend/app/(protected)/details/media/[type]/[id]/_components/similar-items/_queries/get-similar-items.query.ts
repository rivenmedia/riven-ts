import { gql } from "@apollo/client";

import type {
  GetSimilarItemsQuery,
  GetSimilarItemsQueryVariables,
} from "./get-similar-items.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_SIMILAR_ITEMS: TypedDocumentNode<
  GetSimilarItemsQuery,
  GetSimilarItemsQueryVariables
> = gql`
  query GetSimilarItems($id: ID!, $type: TopLevelMediaItemType!) {
    tmdbItem(id: $id, type: $type) {
      id
      type
      similarItems {
        id
        title
        type
        posterUrl
        year
        isRequestable
      }
    }
  }
`;
