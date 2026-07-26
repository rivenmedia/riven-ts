import { Resolution } from "@repo/util-rank-torrent-name";

import { MediaItemContentRating } from "../../dto/enums/content-ratings.enum.ts";
import { MediaItemState } from "../../dto/enums/media-item-state.enum.ts";

export const OPERATORS_BY_KIND = {
  string: ["eq", "neq", "in", "nin", "contains", "startsWith", "endsWith"],
  stringArray: [
    "includes",
    "excludes",
    "includesAll",
    "includesAny",
    "isEmpty",
  ],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "between"],
  date: ["before", "after", "between", "inLastDays"],
  boolean: ["is"],
} as const;

/**
 * The value shape of a rule field, which determines the operators it accepts
 * and which branch of the evaluator handles it.
 */
export type LibrarySectionFieldKind = keyof typeof OPERATORS_BY_KIND;

export interface LibrarySectionFieldDefinition {
  kind: LibrarySectionFieldKind;
  /**
   * A known value set, surfaced to the UI for autocomplete. Advisory only — it
   * is deliberately not enforced by the rule schema so that an existing rule
   * survives an enum being narrowed.
   */
  values?: readonly string[];
  /**
   * The media item types this field is actually populated for. Used to warn in
   * the UI; a rule referencing a field outside its `appliesTo` is valid but
   * will never match.
   */
  appliesTo?: readonly ("movie" | "show")[];
  description: string;
}

/**
 * Every field a library section rule may filter on.
 *
 * This is the single source of truth: the rule schema derives its per-kind
 * field enums from here, the evaluator dispatches on `kind`, and the
 * `librarySectionFields` GraphQL query serialises it so the frontend can build
 * a rule editor without hardcoding anything.
 *
 * Deliberately absent:
 * - `rating`, which is hardcoded to 0 for movies and left null for shows, so it
 *   can never discriminate anything.
 * - Per-file fields. Sections match whole media items, so a show joins a
 *   section with all of its seasons and episodes.
 */
export const LIBRARY_SECTION_FIELDS = {
  title: {
    kind: "string",
    description: "The media item title, lowercased.",
  },
  language: {
    kind: "string",
    description:
      "The original language as an ISO 639-1 code. Show languages are stored as ISO 639-3 and are folded to two letters before matching.",
  },
  country: {
    kind: "string",
    description:
      "The country of origin as a lowercase ISO 3166-1 alpha-2 code. Show countries are stored as TVDB slugs and are folded before matching.",
  },
  network: {
    kind: "string",
    appliesTo: ["show"],
    description: "The broadcast network. Never populated for movies.",
  },
  contentRating: {
    kind: "string",
    values: MediaItemContentRating.options,
    appliesTo: ["show"],
    description:
      'The content rating. Movies are always indexed as "unknown", so this only discriminates shows.',
  },
  state: {
    // Only items that have files can appear in the VFS at all, so offering the
    // other states would let users write rules that silently match nothing.
    kind: "string",
    values: MediaItemState.options.filter((state) =>
      (["completed", "partially_completed", "downloaded"] as string[]).includes(
        state,
      ),
    ),
    description: "The processing state of the item.",
  },
  genres: {
    kind: "stringArray",
    description:
      "Genre names, lowercased. Movie genres are indexed with TMDB casing and are normalised before matching.",
  },
  year: {
    kind: "number",
    description: "The release year.",
  },
  runtime: {
    kind: "number",
    description:
      "Runtime in minutes. For shows this is the mean episode runtime.",
  },
  fileSize: {
    kind: "number",
    description:
      "Size in bytes of the downloaded media file. For shows this is the mean episode file size.",
  },
  releaseDate: {
    kind: "date",
    description: "The original release or first air date.",
  },
  createdAt: {
    kind: "date",
    description: "When the item was added to the library.",
  },
  isAnime: {
    kind: "boolean",
    description:
      'Whether the item is anime, derived from a non-English language plus the "animation" and "anime" genres.',
  },
  "stream.resolution": {
    kind: "string",
    values: Resolution.options,
    description:
      'Resolution of the active stream, normalised to the same canonical set the ranker uses. A release named "4K" or "UHD" matches "2160p".',
  },
  "stream.quality": {
    kind: "string",
    description: 'Source quality of the active stream, e.g. "bluray", "webdl".',
  },
  "stream.codec": {
    kind: "string",
    description: 'Video codec of the active stream, e.g. "h264", "h265".',
  },
  "stream.hdr": {
    kind: "stringArray",
    description:
      'HDR formats present on the active stream, e.g. "dv", "hdr10".',
  },
  "stream.audio": {
    kind: "stringArray",
    description: 'Audio formats on the active stream, e.g. "atmos", "truehd".',
  },
  "stream.remux": {
    kind: "boolean",
    description: "Whether the active stream is a remux.",
  },
  "stream.group": {
    kind: "string",
    description: "The release group of the active stream.",
  },
} as const satisfies Record<string, LibrarySectionFieldDefinition>;

export type LibrarySectionField = keyof typeof LIBRARY_SECTION_FIELDS;

/** The subset of fields whose value shape is `Kind`. */
export type FieldOfKind<Kind extends LibrarySectionFieldKind> = {
  [Field in LibrarySectionField]: (typeof LIBRARY_SECTION_FIELDS)[Field]["kind"] extends Kind
    ? Field
    : never;
}[LibrarySectionField];

/**
 * The fields of a given kind, as a non-empty tuple so it can be handed straight
 * to `z.enum`.
 */
export const fieldsOfKind = <Kind extends LibrarySectionFieldKind>(
  kind: Kind,
) =>
  Object.entries(LIBRARY_SECTION_FIELDS)
    .filter(([, definition]) => definition.kind === kind)
    .map(([field]) => field) as [FieldOfKind<Kind>, ...FieldOfKind<Kind>[]];
