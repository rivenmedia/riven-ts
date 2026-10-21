import { gql } from "@apollo/client";

import type {
  GetItemCastQuery,
  GetItemCastQueryVariables,
} from "./get-item-cast.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const GET_ITEM_CAST: TypedDocumentNode<
  GetItemCastQuery,
  GetItemCastQueryVariables
> = gql`
  query GetItemCast(
    $id: ID!
    $type: TopLevelMediaItemType!
    $language: String!
  ) {
    tmdbItem(id: $id, type: $type) {
      id
      type
      cast(language: $language) {
        id
        name
        character
        profileUrl
      }
    }
  }
`;
