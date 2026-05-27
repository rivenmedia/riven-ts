import { registerEnumType } from "type-graphql";
import z from "zod";

export const DownloadKind = z.enum(["torrent", "nzb"]);

export type DownloadKind = z.infer<typeof DownloadKind>;

registerEnumType(DownloadKind.enum, {
  name: "DownloadKind",
  description:
    "The kind of download source for a media item (torrent or NZB/Usenet)",
});
