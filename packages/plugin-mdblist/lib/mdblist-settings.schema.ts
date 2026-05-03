import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { json, z } from "@rivenmedia/plugin-sdk/validation";

export const MdbListSettings = createPluginSettings({
  apiKey: z
    .string()
    .min(1, "MdbList API Key is required")
    .describe("Your MdbList API Key"),
  lists: json(z.array(z.string().min(1)))
    .default([])
    .describe("List of MdbList lists to request"),
});

export type MdbListSettings = z.infer<typeof MdbListSettings>;
