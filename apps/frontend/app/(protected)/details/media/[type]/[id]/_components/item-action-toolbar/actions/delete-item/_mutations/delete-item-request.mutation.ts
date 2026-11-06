import { gql } from "@apollo/client";

import type {
  DeleteItemRequestMutation,
  DeleteItemRequestMutationVariables,
} from "./delete-item-request.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const DELETE_ITEM_REQUEST: TypedDocumentNode<
  DeleteItemRequestMutation,
  DeleteItemRequestMutationVariables
> = gql`
  mutation DeleteItemRequest($id: ID!) {
    removeItemRequest(itemRequestId: $id)
  }
`;
