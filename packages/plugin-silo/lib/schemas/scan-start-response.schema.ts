import z from "zod";

/**
 * Response body of `POST /api/v2/scan` (`startLibraryScan`), returned with `202 Accepted`.
 *
 * @see https://github.com/Silo-Server/silo-server/blob/main/docs/scan-api.md
 */
export const ScanStartResponse = z.object({
  status: z.literal("accepted"),
  mode: z.enum(["library", "subtree", "file"]),
  library_id: z.string().min(1),
});

export type ScanStartResponse = z.infer<typeof ScanStartResponse>;
