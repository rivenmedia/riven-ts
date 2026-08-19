import { gql } from "@apollo/client";

import type {
  RivenTuiBlacklistActiveStreamMutation,
  RivenTuiBlacklistActiveStreamMutationVariables,
} from "./blacklist-active-stream.mutation.typegen.ts";
import type { TypedDocumentNode } from "@apollo/client";

export const BLACKLIST_ACTIVE_STREAM: TypedDocumentNode<
  RivenTuiBlacklistActiveStreamMutation,
  RivenTuiBlacklistActiveStreamMutationVariables
> = gql`
  mutation RivenTuiBlacklistActiveStream($mediaItemId: ID!) {
    blacklistActiveStream(mediaItemId: $mediaItemId)
  }
`;
