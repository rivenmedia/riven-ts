import { z } from "@rivenmedia/plugin-sdk/validation";

export const MetadataSettingsResponse = z.object({
  anime: z.enum(["tvdb", "tmdb"]),
  tv: z.enum(["tvdb", "tmdb"]),
});

export type MetadataSettingsResponse = z.infer<typeof MetadataSettingsResponse>;
