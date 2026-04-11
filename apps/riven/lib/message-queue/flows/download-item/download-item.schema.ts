import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";
import { FindValidTorrentFlow } from "./steps/find-valid-torrent/find-valid-torrent.schema.ts";

export const DownloadItemFlow = createFlowSchema("download-item", {
  children: FindValidTorrentFlow.shape.output,
  input: z.object({
    id: UUID,
  }),
});

export type DownloadItemFlow = z.infer<typeof DownloadItemFlow>;

export const downloadItemProcessorSchema = DownloadItemFlow.shape.processor;

export const createDownloadItemJob = createFlowJobBuilder(DownloadItemFlow);
