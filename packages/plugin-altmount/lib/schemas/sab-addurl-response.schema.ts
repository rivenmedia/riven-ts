import z from "zod";

/**
 * Response from the SABnzbd-compatible `?mode=addurl` API endpoint.
 *
 * On success: `{ status: true, nzo_ids: ["SABnzbd_nzo_..."] }`
 * On failure: `{ status: false, error: "reason" }`
 *
 * Note: some SAB-compatible implementations may emit numeric values for
 * `nzo_ids` entries in edge cases — coerce defensively.
 */
export const SabAddurlResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal(true),
    nzo_ids: z.array(z.union([z.string(), z.number()]).transform(String)),
  }),
  z.object({
    status: z.literal(false),
    error: z.string(),
  }),
]);

export type SabAddurlResponse = z.infer<typeof SabAddurlResponse>;
