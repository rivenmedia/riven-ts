import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { z } from "@rivenmedia/plugin-sdk/validation";

import { Store } from "./schemas/store.schema.ts";

export const StoreKeys = z.object<
  Record<`${Store}ApiKey`, z.ZodOptional<z.ZodString>>
>({
  realdebridApiKey: z.string().optional(),
  alldebridApiKey: z.string().optional(),
  debriderApiKey: z.string().optional(),
  debridlinkApiKey: z.string().optional(),
  easydebridApiKey: z.string().optional(),
  offcloudApiKey: z.string().optional(),
  pikpakApiKey: z.string().optional(),
  premiumizeApiKey: z.string().optional(),
  torboxApiKey: z.string().optional(),
});

export type StoreKeys = z.infer<typeof StoreKeys>;

export const StremThruSettings = createPluginSettings({
  stremThruUrl: z
    .url()
    .default("https://stremthru.13377001.xyz/")
    .describe("The URL of the StremThru instance to request"),
}).extend(StoreKeys.shape);

export type StremThruSettings = z.infer<typeof StremThruSettings>;
