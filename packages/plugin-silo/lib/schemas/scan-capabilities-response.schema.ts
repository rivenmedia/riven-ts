import z from "zod";

/**
 * Response body of `GET /api/v2/scan/capabilities` (`getScanCapabilities`).
 *
 * @see https://github.com/Silo-Server/silo-server/blob/main/docs/scan-api.md
 */
export const ScanCapabilitiesResponse = z.object({
  state: z.enum(["available", "disabled", "not_configured", "unsupported"]),
  allowed: z.boolean().optional(),
  revision: z.string(),
});

export type ScanCapabilitiesResponse = z.infer<typeof ScanCapabilitiesResponse>;
