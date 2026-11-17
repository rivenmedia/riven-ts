import { gql } from "@apollo/client";

import type {
  RankingProfilesQuery,
  RankingProfilesQueryVariables,
} from "./ranking-profiles.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RANKING_PROFILES: TypedDocumentNode<
  RankingProfilesQuery,
  RankingProfilesQueryVariables
> = gql`
  query RankingProfiles {
    rankingProfiles {
      id
      slug
      name
      description
      builtIn
      isActive
      values
    }
  }
`;
