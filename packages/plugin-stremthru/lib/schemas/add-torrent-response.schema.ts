import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { TorrentStatus } from "./torrent-status.schema.ts";

export const AddTorrentResponse = z.object({
  data: z
    .object({
      id: z.string(),
      files: z.array(DebridFile),
      status: TorrentStatus,
    })
    .nullable(),
});

export type AddTorrentResponse = z.infer<typeof AddTorrentResponse>;
