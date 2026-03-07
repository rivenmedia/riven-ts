import { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createPluginResultSchema } from "../../../../utilities/create-flow-plugin-result-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

const MatchedFile = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  downloadUrl: z.url(),
  matchedMediaItemId: z.int().positive(),
});

export type MatchedFile = z.infer<typeof MatchedFile>;

export const ValidTorrentContainer = TorrentContainer.extend(
  z.object({
    files: z
      .array(MatchedFile)
      .min(1)
      .pipe(z.tuple([MatchedFile], MatchedFile)),
  }).shape,
);

export type ValidTorrentContainer = z.infer<typeof ValidTorrentContainer>;

export const FindValidTorrentContainerFlow = createFlowSchema(
  "download-item.find-valid-torrent-container",
  {
    children: z.array(z.custom<RankedResult>()),
    input: z.object({
      id: z.int(),
      availableDownloaders: z.array(z.string()).min(1),
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
