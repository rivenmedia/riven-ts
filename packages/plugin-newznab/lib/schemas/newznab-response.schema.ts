import z from "zod";

/**
 * A single `@attributes` wrapper, as emitted by Newznab's JSON serialiser.
 * The API always wraps XML attributes in this shape.
 *
 * Note: `value` is coerced from number to string. Some Newznab implementations
 * (notably SABnzbd-integrated indexers) emit numeric values for the size attr
 * — e.g. `{"value": 5368709120}` instead of `{"value": "5368709120"}`. Zod 4's
 * `z.string()` hard-rejects numbers, which would silently drop those items
 * through the size filter (`getItemSizeBytes` returns 0). Coercing keeps the
 * downstream `parseInt` shape intact.
 */
const NewznabAttr = z.object({
  "@attributes": z.object({
    name: z.string(),
    value: z.union([z.string(), z.number()]).transform(String),
  }),
});

/**
 * A single result item from the Newznab JSON feed.
 *
 * Real-world notes:
 * - `attr` is an array when there are multiple attributes, but a plain object
 *   when there is exactly one. We normalise to array in the transformer below.
 * - `category` may be a category ID (e.g. "5040") or a human-readable string
 *   depending on the indexer.
 */
export const NewznabItem = z.object({
  title: z.string(),
  link: z.url(),
  guid: z.string(),
  pubDate: z.string(),
  category: z.string().optional(),
  attr: z
    .union([NewznabAttr, z.array(NewznabAttr)])
    .optional()
    .transform((val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    }),
});

export type NewznabItem = z.infer<typeof NewznabItem>;

/**
 * Helpers to pull a named attribute value out of a parsed NewznabItem.
 */
export function getAttrValue(
  item: NewznabItem,
  name: string,
): string | undefined {
  return item.attr.find((a) => a["@attributes"].name === name)?.["@attributes"]
    .value;
}

/**
 * Extract the size in bytes from a NewznabItem.
 * Newznab indexers emit size as the `size` attr (preferred) or sometimes via
 * the `files` attr. Returns 0 if not found.
 */
export function getItemSizeBytes(item: NewznabItem): number {
  const raw = getAttrValue(item, "size");
  if (!raw) return 0;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Newznab channel response shape (JSON output format, ?o=json).
 *
 * The `item` field is an array when there are multiple results, a plain object
 * for exactly one result, and absent when there are zero results.
 * We normalise to array in the transformer.
 */
const NewznabChannel = z.object({
  response: z
    .object({
      "@attributes": z.object({
        offset: z.string(),
        total: z.string(),
      }),
    })
    .optional(),
  item: z
    .union([NewznabItem, z.array(NewznabItem)])
    .optional()
    .transform((val) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    }),
});

/**
 * Top-level Newznab JSON response.
 */
export const NewznabResponse = z.object({
  channel: NewznabChannel,
});

export type NewznabResponse = z.infer<typeof NewznabResponse>;
