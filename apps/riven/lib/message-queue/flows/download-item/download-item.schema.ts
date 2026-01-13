import { TorrentContainer } from "@repo/util-plugin-sdk/schemas/torrents/torrent-container";

import z from "zod";

import { createFlowSchema } from "../../utilities/create-flow-schema.ts";

export const DownloadItemFlow = createFlowSchema(
  "download-item",
  TorrentContainer,
  z.never().optional(),
  z.object({
    id: z.int(),
  }),
);

export type DownloadItemFlow = z.infer<typeof DownloadItemFlow>;

export const downloadItemProcessorSchema = DownloadItemFlow.shape.processor;
