import z from "zod";

export const SeerrSettings = z.object({
  apiKey: z
    .string()
    .min(1, "Seerr API Key is required")
    .describe("Your Seerr API Key"),
  url: z
    .url("Seerr URL must be a valid URL")
    .describe("Your Seerr instance URL (e.g. http://localhost:5055)"),
  filter: z
    .string()
    .default("approved")
    .describe(
      "Request status filter (all, approved, available, pending, processing)",
    ),
});

export type SeerrSettings = z.infer<typeof SeerrSettings>;
