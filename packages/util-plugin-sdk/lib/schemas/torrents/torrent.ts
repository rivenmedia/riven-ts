import { type } from "arktype";

import { DebridFile } from "./debrid-file.ts";

export const Torrent = type({
  infoHash: "string.hex == 40",
  files: [
    DebridFile.merge({ link: "string.url" }),
    "...",
    DebridFile.merge({ link: "string.url" }).array(),
  ],
  id: "string | number",
});

export type Torrent = typeof Torrent.infer;
