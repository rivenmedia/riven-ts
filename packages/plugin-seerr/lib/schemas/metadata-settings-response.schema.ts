import { type } from "arktype";

export const MetadataSettingsResponse = type({
  anime: "'tvdb' | 'tmdb'",
  tv: "'tvdb' | 'tmdb'",
});

export type MetadataSettingsResponse = typeof MetadataSettingsResponse.infer;
