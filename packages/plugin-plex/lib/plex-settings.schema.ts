import { Duration } from "@repo/util-plugin-sdk/helpers/dates";
import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

export const PlexSettings = z.object({
  plexToken: z
    .string()
    .min(1, "Plex Token is required")
    .describe(
      "Plex Token for accessing the Plex API. See https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/",
    ),
  plexServerUrl: z
    .url("Plex Server URL must be a valid URL")
    .describe("The URL of your Plex server, e.g., http://localhost:32400/"),
  plexLibraryPath: z
    .string()
    .min(1, "Plex Library Path is required")
    .describe(
      'The start of Plex library paths, e.g. "/mount" in "/mount/movies"',
    )
    .default("/mount"),
  watchlistEnabled: z.stringbool().default(false),
  rssUrls: z.array(z.string()).optional(),
  updateIntervalSeconds: json(z.int().nonnegative().nullable())
    .nullable()
    .default(Duration.fromObject({ minutes: 1 }).as("seconds"))
    .describe("Interval in seconds to update content."),
});

export type PlexSettings = z.infer<typeof PlexSettings>;
