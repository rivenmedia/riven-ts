import { z } from "@rivenmedia/plugin-sdk/validation";

export const TorrentioSettings = z.object({
  filter: z
    .string()
    .default("sort=qualitysize%7Cqualityfilter=threed,480p,scr,cam"),
});

export type TorrentioSettings = z.infer<typeof TorrentioSettings>;
