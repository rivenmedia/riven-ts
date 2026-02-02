import z from "zod";

export const plexSettingsSchema = z.object({
  PLEX_TOKEN: z.string().min(1, "Plex Token is required"),
  PLEX_SERVER_URL: z.url("Plex Server URL must be a valid URL"),
  PLEX_LIBRARY_PATH: z.string().min(1, "Plex Library Path is required"),
});
