import z from "zod";

import { TorrentContainer } from "./torrent-container.ts";
import { TorrentInfo } from "./torrent-info.ts";

export const DownloadedTorrent = z.object({
  id: z.int(),
  infoHash: z.string(),
  container: TorrentContainer,
  info: TorrentInfo,
});

export type DownloadedTorrent = z.infer<typeof DownloadedTorrent>;
