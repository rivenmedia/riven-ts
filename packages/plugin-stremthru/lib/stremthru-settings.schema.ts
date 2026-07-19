import { json } from "@repo/util-plugin-sdk/validation";

import z from "zod";

import { Store } from "./schemas/store.schema.ts";

import type { ZodOptional, ZodString } from "zod";

const StoreKeys = z.object<Record<`${Store}ApiKey`, ZodOptional<ZodString>>>({
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

export const StremThruSettings = z
  .object({
    stremThruUrl: z
      .url()
      .default("https://stremthru.13377001.xyz/")
      .describe("The URL of the StremThru instance to request"),
    storePriority: json(
      z
        .array(Store)
        .min(1)
        .transform((stores) => Array.from(new Set(stores))),
    )
      .default(Store.options)
      .describe(
        "The priority order of stores to use.<br /><br />If unset, stores will attempt to download in alphabetical order.",
      ),
  })
  .extend(StoreKeys.shape);

export type StremThruSettings = z.infer<typeof StremThruSettings>;
