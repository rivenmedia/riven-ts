import z from "zod";

/**
 * Torznab items optionally carry a top-level `size` element (in bytes) per
 * the spec. Indexers vary: some emit it as a top-level attribute, others bury
 * it in `<attr>` rows alongside seeders / peers. We parse defensively from
 * both locations in the datasource.
 */
const TorznabItem = z.object({
  title: z.string(),
  /**
   * Some Torznab providers expose size as a top-level numeric string element.
   * Treated as a best-effort fallback when no `<attr name="size">` entry is
   * present.
   */
  size: z.coerce.number().int().nonnegative().optional(),
  attr: z.array(
    z.object({
      "@attributes": z.object({
        name: z.string(),
        value: z.string(),
      }),
    }),
  ),
});

export const TorznabResponse = z.object({
  channel: z.object({
    items: z.array(TorznabItem).default([]),
  }),
});
