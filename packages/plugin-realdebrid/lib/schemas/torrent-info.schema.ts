import { TorrentFile } from "@repo/util-plugin-sdk/schemas/torrents/torrent-file";

import z from "zod";

export const RealDebridTorrentFile = z.object({
  id: z.number(),
});

export const RealDebridTorrentInfo = z.object({
  id: z.string(),
  filename: z.string(),
  original_filename: z.string(),
  hash: z.string(),
  bytes: z.int(),
  progress: z.number(),
  status: z.enum([
    "magnet_error",
    "magnet_conversion",
    "waiting_files_selection",
    "queued",
    "downloading",
    "downloaded",
    "error",
    "virus",
    "compressing",
    "uploading",
    "dead",
  ]),
  added: z.iso.datetime(),
  files: z.array(
    TorrentFile.in.pick({
      id: true,
      path: true,
      bytes: true,
      selected: true,
    }),
  ),
  links: z.array(z.url()),
});

export type RealDebridTorrentInfo = z.infer<typeof RealDebridTorrentInfo>;
