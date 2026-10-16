import { gql } from "@apollo/client";

import type {
  RequestItemMutation,
  RequestItemMutationVariables,
} from "./request-item.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const REQUEST_ITEM: TypedDocumentNode<
  RequestItemMutation,
  RequestItemMutationVariables
> = gql`
  mutation RequestItem($input: RequestItemInput!) {
    requestItem(input: $input)
  }
`;
