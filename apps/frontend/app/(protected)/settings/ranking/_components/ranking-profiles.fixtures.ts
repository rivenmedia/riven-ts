import { z } from "zod";

import type { RankingProfilesQuery } from "../_queries/ranking-profiles.query.typegen";

export type RankingProfileFixture =
  RankingProfilesQuery["rankingProfiles"][number];

const RankField = z
  .strictObject({ fetch: z.boolean(), rank: z.int().optional() })
  .meta({ widget: "custom_rank" });

const rankCategory = (title: string, keys: string[]) =>
  z
    .strictObject(Object.fromEntries(keys.map((key) => [key, RankField])))
    .meta({ title });

/**
 * A trimmed copy of the served profile form schema: the same titles and
 * structure, with a rank or two per category and one settings group.
 */
export const rankingProfileJsonSchema = z.toJSONSchema(
  z.strictObject({
    name: z.string().trim().min(1).meta({ title: "Name" }),
    description: z.string().nullable().meta({ title: "Description" }),
    ranks: z
      .strictObject({
        quality: rankCategory("Quality", ["av1", "remux"]),
        rips: rankCategory("Rips", ["bdrip"]),
        hdr: rankCategory("HDR", ["dolbyVision"]),
        audio: rankCategory("Audio", ["atmos"]),
        extras: rankCategory("Extras", ["threeD"]),
        trash: rankCategory("Trash", ["cam"]),
      })
      .meta({ title: "Ranks" }),
    settings: z
      .strictObject({
        options: z
          .strictObject({
            removeAllTrash: z
              .boolean()
              .default(true)
              .meta({ title: "Remove all trash" }),
          })
          .meta({
            title: "Options",
            description: "Configure various options for torrent ranking",
          }),
      })
      .meta({ title: "Settings" }),
  }),
  { io: "input", unrepresentable: "any" },
) as Record<string, unknown>;

const defaultProfileValues = {
  name: "Default",
  description: "A balanced profile that prioritises higher-quality releases.",
  ranks: {
    quality: {
      av1: { fetch: true, rank: 500 },
      remux: { fetch: true, rank: 10_000 },
    },
    rips: { bdrip: { fetch: false } },
    hdr: { dolbyVision: { fetch: true, rank: 3000 } },
    audio: { atmos: { fetch: true, rank: 1000 } },
    extras: { threeD: { fetch: false } },
    trash: { cam: { fetch: false } },
  },
  settings: { options: { removeAllTrash: true } },
} as const satisfies Record<string, unknown>;

export const defaultProfile = {
  __typename: "RankingProfile",
  id: "profile-default",
  slug: "default",
  name: "Default",
  description: "A balanced profile that prioritises higher-quality releases.",
  builtIn: true,
  isActive: true,
  values: defaultProfileValues,
} as const satisfies RankingProfileFixture;

export const customProfile = {
  __typename: "RankingProfile",
  id: "profile-mine",
  slug: null,
  name: "Mine",
  description: "My own tweaks.",
  builtIn: false,
  isActive: false,
  values: {
    ...defaultProfileValues,
    name: "Mine",
    description: "My own tweaks.",
  },
} as const satisfies RankingProfileFixture;

/** A ranking mutation's result: a success, or a refusal with the given issues. */
export const toMutationResult = (
  issues: { path: string; message: string }[] = [],
) => ({
  __typename: "SettingsMutationResult" as const,
  success: issues.length === 0,
  issues: issues.map((issue) => ({
    __typename: "SettingsIssue" as const,
    ...issue,
  })),
});
