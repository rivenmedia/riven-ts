import { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-schema.ts";
import { createPluginResultSchema } from "../../utilities/create-flow-plugin-result-schema.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const DownloadItemFlow = createFlowSchema("download-item", {
  children: createPluginResultSchema(TorrentContainer),
  input: z.object({
    id: z.int(),
  }),
});

export type DownloadItemFlow = z.infer<typeof DownloadItemFlow>;

export const downloadItemProcessorSchema = DownloadItemFlow.shape.processor;

export const createDownloadItemJob = createFlowJobBuilder(DownloadItemFlow);
