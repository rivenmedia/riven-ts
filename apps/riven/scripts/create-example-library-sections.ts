/**
 * Creates a set of example library sections against a running Riven instance.
 *
 * Intended for development: start the app, run this, and the mount gains a
 * handful of sections covering every rule shape the evaluator supports.
 *
 *   pnpm --filter @repo/riven dev
 *   pnpm --filter @repo/riven sections:examples
 *
 * The endpoint comes from the same settings the server uses. Existing sections
 * with the same directory name are reported and skipped, so it is safe to
 * re-run.
 */

import { settings } from "../lib/utilities/settings.ts";

import type { LibrarySectionRule } from "@repo/util-plugin-sdk/schemas/library-section/index";

const endpoint = `http://${settings.gqlHost}:${String(settings.gqlPort)}/`;

interface ExampleSection {
  name: string;
  slug: string;
  mediaTypes: ("movie" | "show")[];
  split: boolean;
  rule: LibrarySectionRule | null;
  demonstrates: string;
}

const EXAMPLES: ExampleSection[] = [
  {
    name: "Horror",
    slug: "horror",
    mediaTypes: ["movie", "show"],
    split: true,
    demonstrates: "a single condition, split into movies/ and shows/",
    rule: {
      type: "condition",
      field: "genres",
      op: "includesAny",
      value: ["horror"],
    },
  },
  {
    name: "Anime",
    slug: "anime",
    mediaTypes: ["movie", "show"],
    split: false,
    demonstrates:
      "a computed field, and a flat section mixing movies and shows in one directory",
    rule: { type: "condition", field: "isAnime", op: "is", value: true },
  },
  {
    name: "4K Remux",
    slug: "4k-remux",
    mediaTypes: ["movie", "show"],
    split: true,
    demonstrates:
      'stream metadata, and resolution folding — this matches a release parsed as "4k"',
    rule: {
      type: "and",
      rules: [
        {
          type: "condition",
          field: "stream.resolution",
          op: "eq",
          value: "2160p",
        },
        { type: "condition", field: "stream.remux", op: "is", value: true },
      ],
    },
  },
  {
    name: "Recently Added",
    slug: "recently-added",
    mediaTypes: ["movie", "show"],
    split: true,
    demonstrates: "a relative date window",
    rule: {
      type: "condition",
      field: "createdAt",
      op: "inLastDays",
      value: 14,
    },
  },
  {
    name: "Drama, No Horror",
    slug: "drama-no-horror",
    mediaTypes: ["movie"],
    split: false,
    demonstrates:
      "AND composed with NOT — the 'exclude from this one folder' case",
    rule: {
      type: "and",
      rules: [
        {
          type: "condition",
          field: "genres",
          op: "includesAny",
          value: ["drama"],
        },
        {
          type: "not",
          rule: {
            type: "condition",
            field: "genres",
            op: "includes",
            value: "horror",
          },
        },
      ],
    },
  },
  {
    name: "Foreign Language",
    slug: "foreign-language",
    mediaTypes: ["movie", "show"],
    split: true,
    demonstrates:
      'NOT over a list, and language folding so a show indexed as "eng" matches a rule written as "en"',
    rule: {
      type: "not",
      rule: { type: "condition", field: "language", op: "in", value: ["en"] },
    },
  },
  {
    name: "Everything",
    slug: "everything",
    mediaTypes: ["movie", "show"],
    split: true,
    demonstrates: "a null rule, which accepts every item of its media types",
    rule: null,
  },
];

const CREATE_SECTION = `
  mutation CreateExampleSection($input: CreateLibrarySectionInput!) {
    createLibrarySection(input: $input) {
      slug
    }
  }
`;

interface GraphQLResponse {
  data?: { createLibrarySection?: { slug: string } };
  errors?: { message: string }[];
}

async function createSection(section: ExampleSection) {
  const { demonstrates, ...input } = section;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: CREATE_SECTION, variables: { input } }),
  });

  const result = (await response.json()) as GraphQLResponse;
  const error = result.errors?.[0]?.message;

  if (error) {
    console.debug(`  skipped  /${section.slug}\n           ${error}`);

    return;
  }

  console.debug(`  created  /${section.slug}\n           ${demonstrates}`);
}

console.debug(`Creating example library sections via ${endpoint}\n`);

for (const section of EXAMPLES) {
  await createSection(section);
}

console.debug(
  "\nDone. Inspect the result with `ls` on the VFS mount, or query `librarySections`.",
);
