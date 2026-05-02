import { DebridFile } from "@rivenmedia/plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { ItemStatus } from "./item-status.schema.ts";

export const CacheCheckResponse = z.object({
  data: z.object({
    items: z.array(
      z.object({
        files: z.array(DebridFile),
        hash: z.hash("sha1"),
        status: ItemStatus,
      }),
    ),
  }),
});

export type CacheCheckResponse = z.infer<typeof CacheCheckResponse>;
