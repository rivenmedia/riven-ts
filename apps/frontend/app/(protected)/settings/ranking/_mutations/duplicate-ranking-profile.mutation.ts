import { gql } from "@apollo/client";

import type {
  DuplicateRankingProfileMutation,
  DuplicateRankingProfileMutationVariables,
} from "./duplicate-ranking-profile.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const DUPLICATE_RANKING_PROFILE: TypedDocumentNode<
  DuplicateRankingProfileMutation,
  DuplicateRankingProfileMutationVariables
> = gql`
  mutation DuplicateRankingProfile($id: ID!) {
    duplicateRankingProfile(id: $id) {
      success
      issues {
        path
        message
      }
    }
  }
`;
