import z from "zod";

import { Store } from "./schemas/store.schema.ts";

import type { ZodOptional, ZodString } from "zod";

const StoreKeys = z.object<Record<`${Store}ApiKey`, ZodOptional<ZodString>>>({
  realdebridApiKey: z.string().optional().meta({ secret: true }),
  alldebridApiKey: z.string().optional().meta({ secret: true }),
  debriderApiKey: z.string().optional().meta({ secret: true }),
  debridlinkApiKey: z.string().optional().meta({ secret: true }),
  easydebridApiKey: z.string().optional().meta({ secret: true }),
  offcloudApiKey: z.string().optional().meta({ secret: true }),
  pikpakApiKey: z.string().optional().meta({ secret: true }),
  premiumizeApiKey: z.string().optional().meta({ secret: true }),
  torboxApiKey: z.string().optional().meta({ secret: true }),
});

export const StremThruSettings = z
  .object({
    stremThruUrl: z
      .url()
      .default("https://stremthru.13377001.xyz/")
      .describe("The URL of the StremThru instance to request"),
    storePriority: z
      .array(Store)
      .min(1)
      .transform((stores) => [...new Set(stores)])
      .default(Store.options)
      .describe(
        "The priority order of stores to use.<br /><br />If unset, stores will attempt to download in alphabetical order.",
      ),
  })
  .extend(StoreKeys.shape)
  .meta({ title: "StremThru" });

export type StremThruSettings = z.infer<typeof StremThruSettings>;
