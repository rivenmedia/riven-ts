import z from "zod";

import { DebridFile } from "./debrid-file.ts";
import { TorrentInfo } from "./torrent-info.ts";

export const TorrentContainer = z.object({
  infoHash: z.string(),
  files: z.tuple([DebridFile], DebridFile),
  torrentId: z.union([z.string(), z.number()]),
  torrentInfo: TorrentInfo,
});

export type TorrentContainer = z.infer<typeof TorrentContainer>;
