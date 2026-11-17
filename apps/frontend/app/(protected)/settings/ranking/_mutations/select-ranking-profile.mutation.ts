import { gql } from "@apollo/client";

import type {
  SelectRankingProfileMutation,
  SelectRankingProfileMutationVariables,
} from "./select-ranking-profile.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const SELECT_RANKING_PROFILE: TypedDocumentNode<
  SelectRankingProfileMutation,
  SelectRankingProfileMutationVariables
> = gql`
  mutation SelectRankingProfile($id: ID!) {
    selectRankingProfile(id: $id) {
      success
      issues {
        path
        message
      }
    }
  }
`;
