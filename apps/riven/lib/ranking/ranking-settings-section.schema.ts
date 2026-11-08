import { SettingsSchema } from "@repo/util-rank-torrent-name";

import { z } from "zod";

import type { SettingsInput } from "@repo/util-rank-torrent-name";

export const RANKING_NAMESPACE = "riven-ranking";

const resolutionsGroup = SettingsSchema.shape.resolutions.unwrap();
const optionsGroup = SettingsSchema.shape.options.unwrap();
const languagesGroup = SettingsSchema.shape.languages.unwrap();

const resolutions = resolutionsGroup.shape;
const options = optionsGroup.shape;
const languages = languagesGroup.shape;

/**
 * Adapter between RTN's settings shape and the settings framework, which only treats
 * plain `z.ZodObject` fields as display groups and keys stored values by unique leaf name.
 * RTN reuses `exclude`/`preferred` at two levels and wraps groups in `.default()`, so each
 * leaf gets a unique name here and groups are plain objects.
 */
export const RankingSettingsSection = z
  .object({
    patterns: z
      .object({
        requiredPatterns: SettingsSchema.shape.require,
        excludedPatterns: SettingsSchema.shape.exclude,
        preferredPatterns: SettingsSchema.shape.preferred,
      })
      // RTN's patterns are top-level fields, so the group has no RTN meta
      .meta({ title: "Patterns" }),
    resolutions: z
      .object({
        r2160p: resolutions.r2160p,
        r1080p: resolutions.r1080p,
        r720p: resolutions.r720p,
        r480p: resolutions.r480p,
        r360p: resolutions.r360p,
        unknownResolution: resolutions.unknown,
      })
      .meta(resolutionsGroup.meta() ?? {}),
    options: z
      .object({
        removeAllTrash: options.removeAllTrash,
        removeRanksUnder: options.removeRanksUnder,
        removeUnknownLanguages: options.removeUnknownLanguages,
        allowEnglishInLanguages: options.allowEnglishInLanguages,
        removeAdultContent: options.removeAdultContent,
        titleSimilarity: options.titleSimilarity,
      })
      .meta(optionsGroup.meta() ?? {}),
    languages: z
      .object({
        requiredLanguages: languages.required,
        allowedLanguages: languages.allowed,
        excludedLanguages: languages.exclude,
        preferredLanguages: languages.preferred,
      })
      .meta(languagesGroup.meta() ?? {}),
  })
  .meta({ title: "Ranking Settings" });

export type RankingSettingsSectionInput = z.input<
  typeof RankingSettingsSection
>;

type Group = keyof RankingSettingsSectionInput;

/** Adapter leaf -> RTN key, per group. Drives both mapping directions. */
const KEY_MAP = {
  patterns: {
    requiredPatterns: "require",
    excludedPatterns: "exclude",
    preferredPatterns: "preferred",
  },
  resolutions: { unknownResolution: "unknown" },
  options: {},
  languages: {
    requiredLanguages: "required",
    allowedLanguages: "allowed",
    excludedLanguages: "exclude",
    preferredLanguages: "preferred",
  },
} as const satisfies Record<Group, Record<string, string>>;

type Bag = Record<string, unknown>;

function mapKeys(source: Bag, map: Bag, reverse: boolean): Bag {
  const pairs = Object.entries(map) as [string, string][];
  const lookup = new Map(
    pairs.map(([adapter, rtn]) => (reverse ? [rtn, adapter] : [adapter, rtn])),
  );
  const out: Bag = {};

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      out[lookup.get(key) ?? key] = value;
    }
  }

  return out;
}

const NESTED_GROUPS = ["resolutions", "options", "languages"] as const;

export function toRtnSettingsInput(
  section: Partial<RankingSettingsSectionInput>,
): SettingsInput {
  const result: Bag = {};

  if (section.patterns) {
    Object.assign(result, mapKeys(section.patterns, KEY_MAP.patterns, false));
  }

  for (const group of NESTED_GROUPS) {
    const values = section[group];

    if (values) {
      result[group] = mapKeys(values, KEY_MAP[group], false);
    }
  }

  return result;
}

export function fromRtnSettingsInput(
  settings: SettingsInput,
): RankingSettingsSectionInput {
  const result: Bag = {};
  const { resolutions: _r, options: _o, languages: _l, ...patterns } = settings;

  const mappedPatterns = mapKeys(patterns, KEY_MAP.patterns, true);

  if (Object.keys(mappedPatterns).length > 0) {
    result["patterns"] = mappedPatterns;
  }

  for (const group of NESTED_GROUPS) {
    const values = settings[group];

    if (values) {
      result[group] = mapKeys(values, KEY_MAP[group], true);
    }
  }

  return result as RankingSettingsSectionInput;
}
