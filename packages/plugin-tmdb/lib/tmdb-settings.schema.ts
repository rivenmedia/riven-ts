import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { z } from "@rivenmedia/plugin-sdk/validation";

export const TmdbSettings = createPluginSettings({
  apiKey: z
    .string()
    .min(1, "API Key is required")
    .describe("Your TMDB API Key"),
});

export type TmdbSettings = z.infer<typeof TmdbSettings>;
