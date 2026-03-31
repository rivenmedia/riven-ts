import { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { createFlowJobBuilder } from "../../utilities/create-flow-job-builder.ts";
import { createSandboxedJobSchema } from "../utilities/create-sandboxed-job-schema.ts";

export const MapItemsToFilesSandboxedJob = createSandboxedJobSchema(
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

export type MapItemsToFilesSandboxedJob = z.infer<
  typeof MapItemsToFilesSandboxedJob
>;

export const mapItemsToFilesProcessorSchema =
  MapItemsToFilesSandboxedJob.shape.processor;

export const createMapItemsToFilesJob = createFlowJobBuilder(
  MapItemsToFilesSandboxedJob,
);
