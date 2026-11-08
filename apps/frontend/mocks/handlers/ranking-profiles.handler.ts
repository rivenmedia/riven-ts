import { HttpResponse } from "msw";

import { rankingProfileJsonSchema } from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";
import { RANKING_PROFILE_SCHEMA } from "#app/(protected)/settings/ranking/_queries/ranking-profile-schema.query.ts";
import { RANKING_PROFILES } from "#app/(protected)/settings/ranking/_queries/ranking-profiles.query.ts";
import { api } from "#mocks/graphql.ts";

import type { RankingProfileFixture } from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";
import type { RankingProfileSchemaQuery } from "#app/(protected)/settings/ranking/_queries/ranking-profile-schema.query.typegen.ts";
import type { RankingProfilesQuery } from "#app/(protected)/settings/ranking/_queries/ranking-profiles.query.typegen.ts";

export const createRankingProfilesHandler = (
  profiles: RankingProfileFixture[],
) =>
  api.query(RANKING_PROFILES, () =>
    HttpResponse.json({
      data: { rankingProfiles: profiles } satisfies RankingProfilesQuery,
    }),
  );

export const rankingProfileSchemaHandler = api.query(
  RANKING_PROFILE_SCHEMA,
  () =>
    HttpResponse.json({
      data: {
        rankingProfileSchema: rankingProfileJsonSchema,
      } satisfies RankingProfileSchemaQuery,
    }),
);
