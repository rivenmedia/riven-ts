import { gql } from "@apollo/client";

import type {
  RivenTuiRequestItemMutation,
  RivenTuiRequestItemMutationVariables,
} from "./request-item.mutation.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const REQUEST_ITEM: TypedDocumentNode<
  RivenTuiRequestItemMutation,
  RivenTuiRequestItemMutationVariables
> = gql`
  mutation RivenTuiRequestItem($input: RequestItemInput!) {
    requestItem(input: $input)
  }
`;
