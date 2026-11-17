import { gql } from "@apollo/client";

import type {
  RankingProfileSchemaQuery,
  RankingProfileSchemaQueryVariables,
} from "./ranking-profile-schema.query.typegen";
import type { TypedDocumentNode } from "@apollo/client";

export const RANKING_PROFILE_SCHEMA: TypedDocumentNode<
  RankingProfileSchemaQuery,
  RankingProfileSchemaQueryVariables
> = gql`
  query RankingProfileSchema {
    rankingProfileSchema
  }
`;
