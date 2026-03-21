import z from "zod";

export const MetadataSettingsResponse = z.object({
  anime: z.enum(["tvdb", "tmdb"]),
  tv: z.enum(["tvdb", "tmdb"]),
});

export type MetadataSettingsResponse = z.infer<typeof MetadataSettingsResponse>;
