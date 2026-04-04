import { type } from "arktype";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../utilities/create-flow-schema.ts";
import { FindValidTorrentFlow } from "./steps/find-valid-torrent/find-valid-torrent.schema.ts";

export const DownloadItemFlow = createFlowSchema("download-item", {
  children: FindValidTorrentFlow.get("output"),
  input: type({
    id: "number.integer",
  }),
});

export type DownloadItemFlow = typeof DownloadItemFlow.infer;

export const downloadItemProcessorSchema = DownloadItemFlow.get("processor");

export const createDownloadItemJob = createFlowJobBuilder(DownloadItemFlow);
