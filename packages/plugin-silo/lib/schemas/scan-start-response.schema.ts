import z from "zod";

/** @see https://github.com/Silo-Server/silo-server/blob/a52941174808fd21fd55b009e1fe3a47f460f508/docs/scan-api.md */
export const ScanStartResponse = z.object({
  status: z.literal("accepted"),
  mode: z.string(),
  library_id: z.string().min(1),
});

export type ScanStartResponse = z.infer<typeof ScanStartResponse>;
