import z from "zod";

/**
 * A single slot in the SABnzbd-compatible history response.
 * The `status` field uses known terminal values `"Completed"` and `"Failed"`,
 * but is also allowed to be any other string to handle SAB extension implementations.
 */
export const SabHistorySlot = z.object({
  nzo_id: z.union([z.string(), z.number()]).transform(String),
  // Accept the two known terminal values plus any other string from extended implementations
  status: z.union([z.enum(["Completed", "Failed"]), z.string()]),
  name: z.string().optional(),
  fail_message: z.string().optional(),
});

export type SabHistorySlot = z.infer<typeof SabHistorySlot>;

export const SabHistoryResponse = z.object({
  history: z.object({
    slots: z.array(SabHistorySlot),
  }),
});

export type SabHistoryResponse = z.infer<typeof SabHistoryResponse>;
