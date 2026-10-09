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
  query GetItemCast($id: ID!, $language: String!) {
    tmdbItem(id: $id) {
      cast(language: $language) {
        id
        name
        character
        profileUrl
      }
    }
  }
`;
