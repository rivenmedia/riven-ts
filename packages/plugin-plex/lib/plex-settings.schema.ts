import z from "zod";

export const PlexSettings = z.object({
  plexToken: z.string().min(1, "Plex Token is required"),
  plexServerUrl: z.url("Plex Server URL must be a valid URL"),
  plexLibraryPath: z.string().min(1, "Plex Library Path is required"),
});

export type PlexSettings = z.infer<typeof PlexSettings>;
