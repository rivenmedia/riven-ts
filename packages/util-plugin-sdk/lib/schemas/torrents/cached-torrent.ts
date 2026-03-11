import z from "zod";

import { DebridFile } from "./debrid-file.ts";

export const CachedTorrent = z.object({
  files: z.array(
    DebridFile.omit({
      link: true,
    }),
  ),
  hash: z.string(),
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
});

export type CachedTorrent = z.infer<typeof CachedTorrent>;
