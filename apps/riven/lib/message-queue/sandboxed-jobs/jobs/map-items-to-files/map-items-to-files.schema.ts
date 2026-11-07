import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import z from "zod";

import { createSandboxedJobSchema } from "#message-queue/sandboxed-jobs/utilities/create-sandboxed-job-schema.ts";
import { createFlowJobBuilder } from "#message-queue/utilities/create-flow-job-builder.ts";

export const MapItemsToFilesSandboxedJob = createSandboxedJobSchema(
  "download-item.map-items-to-files",
  {
    input: z.object({
      files: z.array(DebridFile).min(1),
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
