import z from "zod";

/**
 * The TV results of `find/{external_id}`.
 */
export const FindShowsByExternalId = z.object({
  tv_results: z.array(
    z.object({
      id: z.int(),
    }),
  ),
});
