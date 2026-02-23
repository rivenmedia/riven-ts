import { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-schema.ts";
import { createPluginResultSchema } from "../../../../utilities/create-flow-plugin-result-schema.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

import type { RankedResult } from "@repo/util-rank-torrent-name";

export const FindValidTorrentContainerFlow = createFlowSchema(
  "download-item.find-valid-torrent-container",
  {
    children: z.array(z.custom<RankedResult>()),
    input: z.object({
      id: z.int(),
      availableDownloaders: z.array(z.string()).min(1),
      failedInfoHashes: z.array(z.hash("sha1")),
    }),
    output: createPluginResultSchema(TorrentContainer),
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
