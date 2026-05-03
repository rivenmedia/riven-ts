import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { z } from "@rivenmedia/plugin-sdk/validation";

export const TorrentioSettings = createPluginSettings({
  filter: z
    .string()
    .default("sort=qualitysize%7Cqualityfilter=threed,480p,scr,cam"),
});

export type TorrentioSettings = z.infer<typeof TorrentioSettings>;
