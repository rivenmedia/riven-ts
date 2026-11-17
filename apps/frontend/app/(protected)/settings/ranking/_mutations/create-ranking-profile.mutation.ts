import { gql } from "@apollo/client";

import type {
  CreateRankingProfileMutation,
  CreateRankingProfileMutationVariables,
} from "./create-ranking-profile.mutation.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const CREATE_RANKING_PROFILE: TypedDocumentNode<
  CreateRankingProfileMutation,
  CreateRankingProfileMutationVariables
> = gql`
  mutation CreateRankingProfile($values: JSONObject!) {
    createRankingProfile(values: $values) {
      success
      issues {
        path
        message
      }
    }
  }
`;
