import { gql } from "@apollo/client";

import type {
  DeleteRankingProfileMutation,
  DeleteRankingProfileMutationVariables,
} from "./delete-ranking-profile.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const DELETE_RANKING_PROFILE: TypedDocumentNode<
  DeleteRankingProfileMutation,
  DeleteRankingProfileMutationVariables
> = gql`
  mutation DeleteRankingProfile($id: ID!) {
    deleteRankingProfile(id: $id) {
      success
      issues {
        path
        message
      }
    }
  }
`;
