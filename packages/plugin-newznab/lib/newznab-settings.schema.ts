import z from "zod";

export const NewznabSettings = z.object({
  indexerUrl: z
    .url()
    .describe(
      "Base URL of the Newznab-compatible indexer (e.g. https://indexer.example.com)",
    ),
  apiKey: z
    .string()
    .min(1)
    .describe("API key for authenticating with the Newznab indexer"),
  minSizeBytes: z
    .number()
    .int()
    .nonnegative()
    .default(100 * 1024 * 1024)
    .describe(
      "Minimum NZB file size in bytes to accept as a candidate (default: 100 MB)",
    ),
  maxSizeBytes: z
    .number()
    .int()
    .nonnegative()
    .default(100 * 1024 * 1024 * 1024)
    .describe(
      "Maximum NZB file size in bytes to accept as a candidate (default: 100 GB)",
    ),
  movieCategories: z
    .array(z.number().int())
    .default([2040, 2045])
    .describe(
      "Newznab category IDs to query for movies (default: 2040 HD, 2045 UHD)",
    ),
  tvCategories: z
    .array(z.number().int())
    .default([5040, 5045])
    .describe(
      "Newznab category IDs to query for TV shows (default: 5040 HD, 5045 UHD)",
    ),
});

export type NewznabSettings = z.infer<typeof NewznabSettings>;
