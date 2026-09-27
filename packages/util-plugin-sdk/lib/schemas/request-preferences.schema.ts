import z from "zod";

/**
 * Per-request preferences that influence how a requested item is scraped, ranked and downloaded.
 *
 * Preferences are stored on an `ItemRequest` and consulted during the download ranking stage,
 * where torrents that do not match are skipped.
 */
export const RequestPreferencesSchema = z
  .object({
    resolutions: z
      .array(z.enum(["2160p", "1440p", "1080p", "720p", "480p", "360p"]))
      .nonempty()
      .optional()
      .describe(
        "Allowed torrent resolutions, e.g. `1080p`. Torrents of other resolutions are skipped during download ranking.",
      ),
    language: z
      .string()
      .length(2)
      .optional()
      .describe(
        "Preferred language as an ISO 639-1 code, e.g. `en`. Torrents without this language are skipped during download ranking.",
      ),
  })
  .refine(
    (preferences) => Object.values(preferences).some((value) => value != null),
    "At least one preference must be set",
  );

export type RequestPreferences = z.infer<typeof RequestPreferencesSchema>;
