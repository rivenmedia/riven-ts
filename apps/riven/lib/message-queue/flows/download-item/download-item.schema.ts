import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-schema.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";
import { FindValidTorrentContainerFlow } from "./steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";

export const DownloadItemFlow = createFlowSchema("download-item", {
  children: FindValidTorrentContainerFlow.shape.output,
  input: z.object({
    id: z.int(),
  }),
});

export type DownloadItemFlow = z.infer<typeof DownloadItemFlow>;

export const downloadItemProcessorSchema = DownloadItemFlow.shape.processor;

export const createDownloadItemJob = createFlowJobBuilder(DownloadItemFlow);
