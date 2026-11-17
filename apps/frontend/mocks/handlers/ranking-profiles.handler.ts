import { HttpResponse } from "msw";

import {
  rankingProfileJsonSchema,
  toMutationResult,
} from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";
import { CREATE_RANKING_PROFILE } from "#app/(protected)/settings/ranking/_mutations/create-ranking-profile.mutation.ts";
import { UPDATE_RANKING_PROFILE } from "#app/(protected)/settings/ranking/_mutations/update-ranking-profile.mutation.ts";
import { RANKING_PROFILE_SCHEMA } from "#app/(protected)/settings/ranking/_queries/ranking-profile-schema.query.ts";
import { RANKING_PROFILES } from "#app/(protected)/settings/ranking/_queries/ranking-profiles.query.ts";
import { api } from "#mocks/graphql.ts";

import type { RankingProfileFixture } from "#app/(protected)/settings/ranking/_components/ranking-profiles.fixtures.ts";

export const createRankingProfilesHandler = (
  profiles: RankingProfileFixture[],
) =>
  api.query(RANKING_PROFILES, () =>
    HttpResponse.json({
      data: { rankingProfiles: profiles },
    }),
  );

export const rankingProfileSchemaHandler = api.query(
  RANKING_PROFILE_SCHEMA,
  () =>
    HttpResponse.json({
      data: {
        rankingProfileSchema: rankingProfileJsonSchema,
      },
    }),
);

/** Reads a profile's name or description from its form values */
const readText = (values: Record<string, unknown>, key: string) => {
  const value = values[key];

  return typeof value === "string" ? value : null;
};

/**
 * Mocks the ranking profiles, keeping the profiles that are created and saved, as Riven does.
 */
export const createRankingProfilesStore = (
  initialProfiles: RankingProfileFixture[],
) => {
  const profiles = [...initialProfiles];

  return {
    profiles,
    handlers: [
      api.query(RANKING_PROFILES, () =>
        HttpResponse.json({ data: { rankingProfiles: profiles } }),
      ),
      api.mutation(CREATE_RANKING_PROFILE, ({ variables: { values } }) => {
        profiles.push({
          __typename: "RankingProfile",
          id: `profile-${String(profiles.length + 1)}`,
          slug: null,
          name: readText(values, "name") ?? "",
          description: readText(values, "description"),
          builtIn: false,
          isActive: false,
          values,
        });

        return HttpResponse.json({
          data: { createRankingProfile: toMutationResult() },
        });
      }),
      api.mutation(UPDATE_RANKING_PROFILE, ({ variables: { id, values } }) => {
        const index = profiles.findIndex((profile) => profile.id === id);
        const profile = profiles[index];

        if (!profile) {
          return HttpResponse.json({
            data: {
              updateRankingProfile: toMutationResult([
                { path: "", message: "Ranking profile not found." },
              ]),
            },
          });
        }

        profiles[index] = {
          ...profile,
          name: readText(values, "name") ?? profile.name,
          description: readText(values, "description"),
          values,
        };

        return HttpResponse.json({
          data: { updateRankingProfile: toMutationResult() },
        });
      }),
    ],
  };
};
