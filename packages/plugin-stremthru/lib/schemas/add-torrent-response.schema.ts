import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import { type } from "arktype";

import { TorrentStatus } from "./torrent-status.schema.ts";

export const AddTorrentResponse = type({
  data: type({
    id: "string",
    files: DebridFile.array(),
    status: TorrentStatus,
  }).or("null"),
});

export type AddTorrentResponse = typeof AddTorrentResponse.infer;
