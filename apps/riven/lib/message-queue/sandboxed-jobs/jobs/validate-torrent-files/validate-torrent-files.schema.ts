import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { MatchedFile } from "../../../flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { createFlowJobBuilder } from "../../../utilities/create-flow-job-builder.ts";
import { createSandboxedJobSchema } from "../../utilities/create-sandboxed-job-schema.ts";
import { MapItemsToFilesSandboxedJob } from "../map-items-to-files/map-items-to-files.schema.ts";

export const ValidateTorrentFilesSandboxedJob = createSandboxedJobSchema(
  "download-item.validate-torrent-files",
  {
    children: MapItemsToFilesSandboxedJob.shape.output,
    output: z.discriminatedUnion("success", [
      z.object({
        success: z.literal(true),
        files: z.array(MatchedFile).min(1),
      }),
      z.object({
        success: z.literal(false),
        reason: z.string(),
      }),
    ]),
    input: z.object({
      id: UUID,
      infoHash: z.hash("sha1"),
      isCacheCheck: z.boolean(),
    }),
  },
);

export type ValidateTorrentFilesSandboxedJob = z.infer<
  typeof ValidateTorrentFilesSandboxedJob
>;

export const validateTorrentFilesProcessorSchema =
  ValidateTorrentFilesSandboxedJob.shape.processor;

export const createValidateTorrentFilesJob = createFlowJobBuilder(
  ValidateTorrentFilesSandboxedJob,
);
