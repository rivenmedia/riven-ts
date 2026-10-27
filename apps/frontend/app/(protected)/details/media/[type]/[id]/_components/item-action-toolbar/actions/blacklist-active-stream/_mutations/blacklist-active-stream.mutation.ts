import { gql } from "@apollo/client";

import type {
  DeleteItemRequestMutation,
  DeleteItemRequestMutationVariables,
} from "./delete-item-request.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const BLACKLIST_ACTIVE_STREAM: TypedDocumentNode<
  DeleteItemRequestMutation,
  DeleteItemRequestMutationVariables
> = gql`
  mutation BlacklistActiveStream($id: ID!) {
    removeItemRequest(itemRequestId: $id)
  }
`;
