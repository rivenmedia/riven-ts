import { gql } from "@apollo/client";

import type {
  GetItemRecommendationsQuery,
  GetItemRecommendationsQueryVariables,
} from "./get-item-recommendations.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_RECOMMENDATIONS: TypedDocumentNode<
  GetItemRecommendationsQuery,
  GetItemRecommendationsQueryVariables
> = gql`
  query GetItemRecommendations($id: ID!, $type: TopLevelMediaItemType!) {
    tmdbItem(id: $id, type: $type) {
      id
      type
      recommendations {
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
