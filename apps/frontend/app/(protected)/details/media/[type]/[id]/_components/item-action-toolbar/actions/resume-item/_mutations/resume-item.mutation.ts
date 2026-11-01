import { gql } from "@apollo/client";

import type {
  ResumeItemMutation,
  ResumeItemMutationVariables,
} from "./resume-item.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RESUME_ITEM: TypedDocumentNode<
  ResumeItemMutation,
  ResumeItemMutationVariables
> = gql`
  mutation ResumeItem($id: ID!) {
    resumeMediaItem(mediaItemId: $id) {
      ... on MediaItem {
        id
        state
      }
    }
  }
`;
