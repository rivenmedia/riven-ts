import z from "zod";

export const ScanCapabilitiesResponse = z.object({
  // Silo may add states, and its API contract says to treat unknown ones as unavailable
  state: z.string(),
  allowed: z.boolean().optional(),
});

export type ScanCapabilitiesResponse = z.infer<typeof ScanCapabilitiesResponse>;
