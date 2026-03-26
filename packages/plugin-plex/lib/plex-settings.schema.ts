import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

const PlexListUrlSchema = z
  .string()
  .regex(
    /^https:\/\/watch\.plex\.tv\/u\/[^/]+\/lists\/[^/]+$/,
    "Each list must be a valid Plex list share URL in the format https://watch.plex.tv/u/<user>/lists/<list-slug>",
  );

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
  lists: json(
    z
      .array(PlexListUrlSchema)
      .describe(
        "The Plex lists to pull items from, in the format https://watch.plex.tv/u/<user>/lists/<list-slug>",
      ),
  ),
});

export type PlexSettings = z.infer<typeof PlexSettings>;
