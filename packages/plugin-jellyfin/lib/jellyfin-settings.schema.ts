import z from "zod";

export const JellyfinSettings = z.object({
  jellyfinToken: z
    .string()
    .min(1, "Jellyfin Token is required")
    .describe("Jellyfin Token for accessing the Jellyfin API."),
  jellyfinServerUrl: z
    .url("Jellyfin Server URL must be a valid URL")
    .describe("The URL of your Jellyfin server, e.g., http://localhost:8096/"),
  jellyfinLibraryPath: z
    .string()
    .min(1, "Jellyfin Library Path is required")
    .describe(
      'The start of Jellyfin library paths, e.g. "/mount" in "/mount/movies"',
    )
    .default("/mount"),
});

export type JellyfinSettings = z.infer<typeof JellyfinSettings>;
