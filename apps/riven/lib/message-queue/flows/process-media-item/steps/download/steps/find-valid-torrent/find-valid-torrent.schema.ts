import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../../../../../utilities/create-flow-job-builder.ts";
import { createPluginResultSchema } from "../../../../../../utilities/create-flow-plugin-result-schema.ts";
import { createFlowSchema } from "../../../../../../utilities/create-flow-schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const MatchedFile = DebridFile.extend({
  matchedMediaItemId: UUID,
  isCachedFile: z.boolean(),
}).refine(
  (file) => file.isCachedFile || file.link !== undefined,
  "File must have a download URL",
);

export type MatchedFile = z.infer<typeof MatchedFile>;

export const ValidTorrent = z.object({
  torrentId: z.string().min(1),
  infoHash: z.hash("sha1"),
  provider: z.string().nullable(),
  files: z.array(MatchedFile).min(1),
});

export type ValidTorrent = z.infer<typeof ValidTorrent>;

export const FindValidTorrentFlow = createFlowSchema(
  "download-item.find-valid-torrent",
  {
    children: z.array(z.custom<RankedResult>()),
    input: z.object({
      id: UUID,
      itemTitle: z.string().min(1),
      failedInfoHashes: z.array(z.hash("sha1")),
    }),
    output: createPluginResultSchema(ValidTorrent).nullable(),
  },
);

export type FindValidTorrentFlow = z.infer<typeof FindValidTorrentFlow>;

export const findValidTorrentProcessorSchema =
  FindValidTorrentFlow.shape.processor;

export const createFindValidTorrentJob =
  createFlowJobBuilder(FindValidTorrentFlow);
