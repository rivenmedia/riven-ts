import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { TorrentStatus } from "./torrent-status.schema.ts";

/**
 * Response shape for `GET /v0/store/torz/{torzId}`.
 *
 * Mirrors {@link AddTorrentResponse} but treats `status` as optional to stay
 * lenient against StremThru response variations.
 *
 * @see {@link https://docs.stremthru.13377001.xyz/api/torz}
 */
export const GetTorrentResponse = z.object({
  data: z
    .object({
      id: z.string(),
      files: z.array(DebridFile),
      status: TorrentStatus.optional(),
    })
    .nullable(),
});

export type GetTorrentResponse = z.infer<typeof GetTorrentResponse>;
