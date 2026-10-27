import { gql } from "@apollo/client";

import type {
  BlacklistActiveStreamMutation,
  BlacklistActiveStreamMutationVariables,
} from "./blacklist-active-stream.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const BLACKLIST_ACTIVE_STREAM: TypedDocumentNode<
  BlacklistActiveStreamMutation,
  BlacklistActiveStreamMutationVariables
> = gql`
  mutation BlacklistActiveStream($id: ID!) {
    blacklistActiveStream(mediaItemId: $id)
  }
`;
