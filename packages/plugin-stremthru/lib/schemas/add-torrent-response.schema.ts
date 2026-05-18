import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { TorrentStatus } from "./torrent-status.schema.ts";

export const AddTorrentResponse = z.looseObject({
  data: z
    .object({
      id: z.string(),
      files: z.array(DebridFile),
      status: TorrentStatus,
    })
    .nullable(),
  /**
   * Optional ISO-8601 timestamp included by some stores (notably TorBox
   * on its Essentials / free tiers) when the account is rate-limited and
   * cannot accept more uncached torrents until the cooldown expires.
   *
   * @see {@link https://github.com/MunifTanjim/stremthru/blob/main/store/torbox/user.go} `cooldown_until` field
   */
  cooldown_until: z.iso.datetime().nullish(),
});

export type AddTorrentResponse = z.infer<typeof AddTorrentResponse>;
