import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createPluginResultSchema } from "../../../../utilities/create-flow-plugin-result-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const MatchedFile = DebridFile.extend({
  matchedMediaItemId: z.int().positive(),
  isCachedFile: z.boolean(),
}).refine(
  (file) => file.isCachedFile || file.link !== undefined,
  "File must have a download URL",
);

export type MatchedFile = z.infer<typeof MatchedFile>;

export const ValidTorrentContainer = z.object({
  torrentId: z.string().min(1),
  infoHash: z.hash("sha1"),
  provider: z.string().nullable(),
  files: z
    .array(MatchedFile)
    .min(1)
    .pipe(z.tuple([MatchedFile], MatchedFile)),
});

export type ValidTorrentContainer = z.infer<typeof ValidTorrentContainer>;

export const FindValidTorrentContainerFlow = createFlowSchema(
  "download-item.find-valid-torrent-container",
  {
    children: z.array(z.custom<RankedResult>()),
    input: z.object({
      id: z.int(),
      itemTitle: z.string().min(1),
      availableDownloaders: z
        .array(
          z.object({
            pluginName: z.string(),
            hasCacheCheckHook: z.boolean(),
            hasProviderListHook: z.boolean(),
          }),
        )
        .min(1),
      failedInfoHashes: z.array(z.hash("sha1")),
    }),
    output: createPluginResultSchema(ValidTorrentContainer),
  },
);

export type FindValidTorrentContainerFlow = z.infer<
  typeof FindValidTorrentContainerFlow
>;

export const findValidTorrentContainerProcessorSchema =
  FindValidTorrentContainerFlow.shape.processor;

export const createFindValidTorrentContainerJob = createFlowJobBuilder(
  FindValidTorrentContainerFlow,
);
