import z from "zod";

import { DebridFile } from "./debrid-file.ts";

export const Torrent = z.object({
  infoHash: z.string(),
  files: z.tuple(
    [DebridFile.required({ link: true })],
    DebridFile.required({ link: true }),
  ),
  id: z.union([z.string(), z.number()]),
});

export type Torrent = z.infer<typeof Torrent>;
