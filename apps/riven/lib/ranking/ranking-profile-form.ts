import {
  RankingModelSchema,
  RankingModelSchemaMetadata,
  SettingsSchema,
  createRankingModel,
} from "@repo/util-rank-torrent-name";

import z from "zod";

import { RankingProfileConfig } from "./ranking-profile-config.schema.ts";
import {
  RankingSettingsSection,
  fromRtnSettingsInput,
  toRtnSettingsInput,
} from "./ranking-settings-section.schema.ts";
import { sparsifyProfileConfig } from "./sparsify-profile-config.ts";

import type { RankingProfile } from "#database/entities/ranking-profile.entity.ts";
import type { SettingsIssue } from "#graphql/resolvers/settings/types/settings-issue.type.ts";
import type { RankingModel } from "@repo/util-rank-torrent-name";

type RankCategory = z.infer<typeof RankingModelSchemaMetadata>["category"];
type RankKey = keyof RankingModel;

const CATEGORY_TITLES = {
  quality: "Quality",
  rips: "Rips",
  hdr: "HDR",
  audio: "Audio",
  extras: "Extras",
  trash: "Trash",
} as const satisfies Record<RankCategory, string>;

const RankField = z
  .object({ fetch: z.boolean(), rank: z.int().optional() })
  .refine(({ fetch, rank }) => !fetch || rank !== undefined, {
    path: ["rank"],
    message: "Enter a rank, or turn off fetching.",
  })
  // After `refine`, which returns a copy without the meta.
  .meta({ widget: "custom_rank" });

/** Rank keys per category, in RTN's declared order. */
const RANK_KEYS_BY_CATEGORY = Map.groupBy(
  Object.entries(RankingModelSchema.shape).map(
    ([key, field]) =>
      [
        key as RankKey,
        RankingModelSchemaMetadata.parse(field.meta()).category,
      ] as const,
  ),
  ([, category]) => category,
)
  .entries()
  .map(
    ([category, entries]) => [category, entries.map(([key]) => key)] as const,
  )
  .toArray();

const RankGroups = z.object(
  Object.fromEntries(
    RANK_KEYS_BY_CATEGORY.map(([category, keys]) => [
      category,
      z
        .object(Object.fromEntries(keys.map((key) => [key, RankField])))
        .meta({ title: CATEGORY_TITLES[category] }),
    ]),
  ) as Record<RankCategory, z.ZodObject<Record<string, typeof RankField>>>,
);

const RankingProfileForm = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable(),
  ranks: RankGroups,
  settings: RankingSettingsSection,
});

type RankingProfileFormInput = z.input<typeof RankingProfileForm>;
type RankFieldValue = z.input<typeof RankField>;

/** The JSON Schema of the profile form, in the same dialect as settings sections. */
export function buildRankingProfileJsonSchema() {
  return z.toJSONSchema(RankingProfileForm, {
    io: "input",
    unrepresentable: "any",
  });
}

/** The form values of a profile, with RTN defaults filled in. */
export function toProfileFormValues(
  profile: Pick<
    RankingProfile,
    "name" | "description" | "rankingModel" | "settings"
  >,
): RankingProfileFormInput {
  const rankingModel = createRankingModel(profile.rankingModel);

  const ranks = Object.fromEntries(
    RANK_KEYS_BY_CATEGORY.map(([category, keys]) => [
      category,
      Object.fromEntries(
        keys.map((key): [string, RankFieldValue] => {
          const rank = rankingModel[key];

          return [
            key,
            rank === null ? { fetch: false } : { fetch: true, rank },
          ];
        }),
      ),
    ]),
  ) as RankingProfileFormInput["ranks"];

  return {
    name: profile.name,
    description: profile.description,
    ranks,
    settings: fromRtnSettingsInput(SettingsSchema.parse(profile.settings)),
  };
}

function toIssues(error: z.ZodError): SettingsIssue[] {
  return error.issues.map(({ path, message }) => ({
    path: path.map(String).join("."),
    message,
  }));
}

/** The form path of a stored-config issue (only rank paths differ). */
function toFormPath(configPath: readonly PropertyKey[]) {
  const [group, key] = configPath;

  const category = RANK_KEYS_BY_CATEGORY.find(([, keys]) =>
    keys.includes(key as RankKey),
  )?.[0];

  return group === "rankingModel" && category
    ? `ranks.${category}.${String(key)}.rank`
    : configPath.map(String).join(".");
}

/**
 * Validates submitted form values and converts them to a sparse profile
 * config. Issue paths are the form's dotted paths.
 */
export function fromProfileFormValues(values: unknown):
  | { issues: SettingsIssue[] }
  | {
      issues: [];
      name: string;
      description: string | null;
      config: RankingProfileConfig;
    } {
  const form = RankingProfileForm.safeParse(values);

  if (!form.success) {
    return { issues: toIssues(form.error) };
  }

  const { name, description, ranks, settings } = form.data;

  const rankingModel = Object.fromEntries(
    Object.values(ranks).flatMap((group) =>
      Object.entries(group).map(([key, { fetch, rank }]) => [
        key,
        fetch ? rank : null,
      ]),
    ),
  );

  const config = RankingProfileConfig.safeParse({
    rankingModel,
    settings: toRtnSettingsInput(settings),
  });

  if (!config.success) {
    return {
      issues: config.error.issues.map(({ path, message }) => ({
        path: toFormPath(path),
        message,
      })),
    };
  }

  return {
    issues: [],
    name,
    description,
    config: sparsifyProfileConfig(config.data),
  };
}
