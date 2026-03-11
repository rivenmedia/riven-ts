import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

export const CacheCheckResponse = z.object({
  data: z.object({
    items: z.array(
      z.object({
        files: z.array(DebridFile),
        hash: z.hash("sha1"),
        status: z.enum([
          "cached",
          "downloaded",
          "downloading",
          "failed",
          "invalid",
          "processing",
          "queued",
          "unknown",
          "uploading",
        ]),
      }),
    ),
  }),
});

export type CacheCheckResponse = z.infer<typeof CacheCheckResponse>;
