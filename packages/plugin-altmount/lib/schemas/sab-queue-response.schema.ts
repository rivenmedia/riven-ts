import z from "zod";

/**
 * A single slot in the SABnzbd-compatible queue response.
 *
 * Numeric fields like `percentage`, `mb`, and `mbleft` are coerced
 * defensively because some SAB-compatible APIs emit numbers where the
 * canonical SAB protocol uses strings.
 */
export const SabQueueSlot = z.object({
  nzo_id: z.union([z.string(), z.number()]).transform(String),
  status: z.string(), // "Downloading", "Queued", "Paused", etc.
  percentage: z.union([z.string(), z.number()]).transform(String).optional(),
  mb: z.union([z.string(), z.number()]).transform(String).optional(),
  mbleft: z.union([z.string(), z.number()]).transform(String).optional(),
});

export type SabQueueSlot = z.infer<typeof SabQueueSlot>;

export const SabQueueResponse = z.object({
  queue: z.object({
    slots: z.array(SabQueueSlot),
  }),
});

export type SabQueueResponse = z.infer<typeof SabQueueResponse>;
