import { gql } from "@apollo/client";

import type {
  UpdateRankingProfileMutation,
  UpdateRankingProfileMutationVariables,
} from "./update-ranking-profile.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const UPDATE_RANKING_PROFILE: TypedDocumentNode<
  UpdateRankingProfileMutation,
  UpdateRankingProfileMutationVariables
> = gql`
  mutation UpdateRankingProfile($id: ID!, $values: JSONObject!) {
    updateRankingProfile(id: $id, values: $values) {
      success
      issues {
        path
        message
      }
    }
  }
`;
