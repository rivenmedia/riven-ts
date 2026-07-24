import z from "zod";

export const JellyfinSettings = z.object({
  jellyfinToken: z
    .string()
    .min(1, "Jellyfin token is required")
    .describe("Jellyfin token for accessing the Jellyfin API."),
  jellyfinServerUrl: z
    .url({
      error: "Jellyfin server URL must be a valid URL",
      protocol: z.regexes.httpProtocol,
    })
    .describe("The URL of your Jellyfin server, e.g., http://localhost:8096/"),
  jellyfinLibraryPath: z
    .string()
    .min(1, "Jellyfin library path is required")
    .describe(
      'The start of Jellyfin library paths, e.g. "/mount" in "/mount/movies"',
    )
    .default("/mount"),
});

export type JellyfinSettings = z.infer<typeof JellyfinSettings>;
