import { gql } from "@apollo/client";

import type {
  RivenTuiRemoveItemRequestMutation,
  RivenTuiRemoveItemRequestMutationVariables,
} from "./remove-item-request.mutation.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const REMOVE_ITEM_REQUEST: TypedDocumentNode<
  RivenTuiRemoveItemRequestMutation,
  RivenTuiRemoveItemRequestMutationVariables
> = gql`
  mutation RivenTuiRemoveItemRequest($itemRequestId: ID!) {
    removeItemRequest(itemRequestId: $itemRequestId)
  }
`;
