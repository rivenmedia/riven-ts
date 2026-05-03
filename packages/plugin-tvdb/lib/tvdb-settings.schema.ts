import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { z } from "@rivenmedia/plugin-sdk/validation";

export const TvdbSettings = createPluginSettings({
  apiKey: z
    .string()
    .default("6be85335-5c4f-4d8d-b945-d3ed0eb8cdce")
    .describe("The TVDB API key used to request a token."),
});

export type TvdbSettings = z.infer<typeof TvdbSettings>;
