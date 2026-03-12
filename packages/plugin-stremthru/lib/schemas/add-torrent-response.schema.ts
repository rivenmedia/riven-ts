import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

export const AddTorrentResponse = z.object({
  data: z
    .object({
      id: z.string(),
      files: z.array(DebridFile),
    })
    .nullable(),
});

export type AddTorrentResponse = z.infer<typeof AddTorrentResponse>;
