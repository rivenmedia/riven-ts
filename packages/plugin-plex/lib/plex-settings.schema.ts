import { type } from "arktype";

export const PlexSettings = type({
  plexToken: type("string > 0").describe(
    "Plex Token for accessing the Plex API. See https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/",
  ),
  plexServerUrl: type("string.url").describe(
    "The URL of your Plex server, e.g., http://localhost:32400/",
  ),
  plexLibraryPath: type("string > 0")
    .describe(
      'The start of Plex library paths, e.g. "/mount" in "/mount/movies"',
    )
    .default("/mount"),
});

export type PlexSettings = typeof PlexSettings.infer;
