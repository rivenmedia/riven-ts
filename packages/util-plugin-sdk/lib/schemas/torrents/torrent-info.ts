import z from "zod";

import { TorrentFile } from "./torrent-file.ts";

export const TorrentInfo = z
  .object({
    id: z.union([z.int(), z.string()]),
    name: z.string(),
    status: z.string().optional(),
    infoHash: z.string(),
    progress: z.number().nonnegative().optional(),
    bytes: z.int().nonnegative().optional(),
    createdAt: z.iso.datetime().optional(),
    expiresAt: z.iso.datetime().optional(),
    completedAt: z.iso.datetime().optional(),
    alternativeFilename: z.string().optional(),
    files: z.record(z.union([z.int(), z.string()]), TorrentFile).default({}),
    links: z.array(z.url()).default([]),
  })
  .transform((data) => ({
    ...data,
    sizeMB: data.bytes ? data.bytes / (1024 * 1024) : 0,
    isCached: Object.keys(data.files).length > 0,
  }));

export type TorrentInfo = z.infer<typeof TorrentInfo>;
