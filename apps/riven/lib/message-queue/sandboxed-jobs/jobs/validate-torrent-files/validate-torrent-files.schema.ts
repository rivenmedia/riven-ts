import { type } from "arktype";

import { MatchedFile } from "../../../flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { createFlowJobBuilder } from "../../../utilities/create-flow-job-builder.ts";
import { createSandboxedJobSchema } from "../../utilities/create-sandboxed-job-schema.ts";
import { MapItemsToFilesSandboxedJob } from "../map-items-to-files/map-items-to-files.schema.ts";

export const ValidateTorrentFilesSandboxedJob = createSandboxedJobSchema(
  "download-item.validate-torrent-files",
  {
    children: MapItemsToFilesSandboxedJob.get("output"),
    output: type({
      success: "true",
      files: MatchedFile.array(), // min 1
    }).or(
      type({
        success: "false",
        reason: "string > 0",
      }),
    ),
    input: type({
      id: "number.integer > 0",
      infoHash: "string.hex == 40",
      isCacheCheck: "boolean",
    }),
  },
);

export type ValidateTorrentFilesSandboxedJob =
  typeof ValidateTorrentFilesSandboxedJob.infer;

export const validateTorrentFilesProcessorSchema =
  ValidateTorrentFilesSandboxedJob.get("processor");

export const createValidateTorrentFilesJob = createFlowJobBuilder(
  ValidateTorrentFilesSandboxedJob,
);
