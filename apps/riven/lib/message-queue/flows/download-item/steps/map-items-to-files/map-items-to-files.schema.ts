import { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { createFlowJobBuilder } from "../../../../utilities/create-flow-job-builder.ts";
import { createFlowSchema } from "../../../../utilities/create-flow-schema.ts";

export const MapItemsToFilesFlow = createFlowSchema(
  "download-item.map-items-to-files",
  {
    input: MediaItemDownloadRequestedResponse.pick({
      files: true,
    }),
    output: z.object({
      episodes: z.record(z.string(), DebridFile),
      movies: z.record(z.string(), DebridFile),
    }),
  },
);

export type MapItemsToFilesFlow = z.infer<typeof MapItemsToFilesFlow>;

export const mapItemsToFilesProcessorSchema =
  MapItemsToFilesFlow.shape.processor;

export const createMapItemsToFilesJob =
  createFlowJobBuilder(MapItemsToFilesFlow);
