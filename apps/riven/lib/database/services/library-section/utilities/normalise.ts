/**
 * Normalisation for library section rule matching.
 *
 * Movies and shows are indexed by different providers, which store the same
 * concepts in different formats. Rather than making users write one rule per
 * media type, everything is folded to a single representation before matching:
 *
 * | Field    | Movies (TMDB)              | Shows (TVDB)                 |
 * | -------- | -------------------------- | ---------------------------- |
 * | genres   | title case, "Science Fiction" | lowercased already        |
 * | language | ISO 639-1, "en"            | ISO 639-2/3, "eng"           |
 * | country  | ISO 3166-1 alpha-2, "US"   | alpha-3 lowercased, "usa"    |
 *
 * Movie genres come from `plugin-tmdb/lib/hooks/index-tmdb-media-item.ts`;
 * show genres are lowercased in
 * `apps/riven/lib/database/services/indexer/utilities/persist-show-indexer-data.ts`.
 *
 * The real fix is to normalise at index time so the database is consistent.
 * Until then this module is the single place that papers over it, and the
 * tables below are deliberately partial — anything unmapped falls through to a
 * plain lowercase, which is correct for values already in the target format.
 */

import { RESOLUTION_MAP } from "@repo/util-rank-torrent-name";

/** ISO 639-2/3 to ISO 639-1. */
const LANGUAGE_ALPHA_3_TO_ALPHA_2 = new Map([
  ["ara", "ar"],
  ["ben", "bn"],
  ["bul", "bg"],
  ["cat", "ca"],
  ["ces", "cs"],
  ["cze", "cs"],
  ["dan", "da"],
  ["deu", "de"],
  ["dut", "nl"],
  ["ell", "el"],
  ["eng", "en"],
  ["est", "et"],
  ["fas", "fa"],
  ["fil", "tl"],
  ["fin", "fi"],
  ["fra", "fr"],
  ["fre", "fr"],
  ["ger", "de"],
  ["gre", "el"],
  ["heb", "he"],
  ["hin", "hi"],
  ["hrv", "hr"],
  ["hun", "hu"],
  ["ice", "is"],
  ["ind", "id"],
  ["isl", "is"],
  ["ita", "it"],
  ["jpn", "ja"],
  ["kor", "ko"],
  ["lav", "lv"],
  ["lit", "lt"],
  ["mar", "mr"],
  ["may", "ms"],
  ["msa", "ms"],
  ["nld", "nl"],
  ["nor", "no"],
  ["per", "fa"],
  ["pol", "pl"],
  ["por", "pt"],
  ["ron", "ro"],
  ["rum", "ro"],
  ["rus", "ru"],
  ["slk", "sk"],
  ["slo", "sk"],
  ["slv", "sl"],
  ["spa", "es"],
  ["srp", "sr"],
  ["swe", "sv"],
  ["tam", "ta"],
  ["tel", "te"],
  ["tgl", "tl"],
  ["tha", "th"],
  ["tur", "tr"],
  ["ukr", "uk"],
  ["urd", "ur"],
  ["vie", "vi"],
  ["zho", "zh"],
  ["chi", "zh"],
]);

/** ISO 3166-1 alpha-3 to alpha-2. */
const COUNTRY_ALPHA_3_TO_ALPHA_2 = new Map([
  ["are", "ae"],
  ["arg", "ar"],
  ["aus", "au"],
  ["aut", "at"],
  ["bel", "be"],
  ["bgr", "bg"],
  ["bra", "br"],
  ["can", "ca"],
  ["che", "ch"],
  ["chl", "cl"],
  ["chn", "cn"],
  ["col", "co"],
  ["cze", "cz"],
  ["deu", "de"],
  ["dnk", "dk"],
  ["egy", "eg"],
  ["esp", "es"],
  ["fin", "fi"],
  ["fra", "fr"],
  ["gbr", "gb"],
  ["grc", "gr"],
  ["hkg", "hk"],
  ["hrv", "hr"],
  ["hun", "hu"],
  ["idn", "id"],
  ["ind", "in"],
  ["irl", "ie"],
  ["isl", "is"],
  ["isr", "il"],
  ["ita", "it"],
  ["jpn", "jp"],
  ["ken", "ke"],
  ["kor", "kr"],
  ["mex", "mx"],
  ["mys", "my"],
  ["nga", "ng"],
  ["nld", "nl"],
  ["nor", "no"],
  ["nzl", "nz"],
  ["per", "pe"],
  ["phl", "ph"],
  ["pol", "pl"],
  ["prt", "pt"],
  ["rou", "ro"],
  ["rus", "ru"],
  ["sau", "sa"],
  ["sgp", "sg"],
  ["svk", "sk"],
  ["svn", "si"],
  ["swe", "se"],
  ["srb", "rs"],
  ["tha", "th"],
  ["tur", "tr"],
  ["twn", "tw"],
  ["ukr", "ua"],
  ["usa", "us"],
  ["vnm", "vn"],
  ["zaf", "za"],
]);

export const normaliseText = (value: string | null | undefined) => {
  const normalised = value?.trim().toLowerCase();

  if (!normalised) {
    return null;
  }

  return normalised;
};

export const normaliseTextList = (
  values: readonly string[] | null | undefined,
) => [
  ...new Set(
    (values ?? [])
      .map((value) => normaliseText(value))
      .filter((value) => value !== null),
  ),
];

const foldAlpha3 = (
  value: string | null | undefined,
  lookup: ReadonlyMap<string, string>,
) => {
  const normalised = normaliseText(value);

  if (normalised === null) {
    return null;
  }

  return lookup.get(normalised) ?? normalised;
};

export const normaliseLanguage = (language: string | null | undefined) =>
  foldAlpha3(language, LANGUAGE_ALPHA_3_TO_ALPHA_2);

export const normaliseCountry = (country: string | null | undefined) =>
  foldAlpha3(country, COUNTRY_ALPHA_3_TO_ALPHA_2);

/**
 * Folds a parsed release resolution onto the canonical set.
 *
 * `Stream.parsedData.resolution` holds whatever the release name said — "4k",
 * "UHD", "1440p" — while the ranker interprets all of those through
 * `RESOLUTION_MAP` before acting on them. Sections use the same mapping so that
 * a rule written against "2160p" means the same thing here as it does in the
 * ranking config, regardless of how a particular release spelled it.
 */
export const normaliseResolution = (resolution: string | null | undefined) => {
  const normalised = normaliseText(resolution);

  if (normalised === null) {
    return null;
  }

  return RESOLUTION_MAP.get(normalised) ?? normalised;
};
