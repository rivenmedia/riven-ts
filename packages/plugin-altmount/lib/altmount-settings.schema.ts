import z from "zod";

export const AltmountSettings = z.object({
  altmountUrl: z
    .url()
    .describe("altmount base URL (e.g. http://10.0.0.66:8081)"),
  altmountApiKey: z
    .string()
    .min(1)
    .describe("altmount SABnzbd-compatible API key"),
  pollIntervalMs: z
    .number()
    .int()
    .positive()
    .default(10_000)
    .describe(
      "How often (ms) to poll the altmount queue while waiting for a download to finish",
    ),
  pollTimeoutMs: z
    .number()
    .int()
    .positive()
    .default(30 * 60 * 1000)
    .describe(
      "Maximum total time (ms) to wait before giving up on a download (default: 30 min)",
    ),
});

export type AltmountSettings = z.infer<typeof AltmountSettings>;
