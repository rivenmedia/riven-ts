import { MediaItemDownloadRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

import { type } from "arktype";

import { createFlowJobBuilder } from "../../../utilities/create-flow-job-builder.ts";
import { createSandboxedJobSchema } from "../../utilities/create-sandboxed-job-schema.ts";

export const MapItemsToFilesSandboxedJob = createSandboxedJobSchema(
  "download-item.map-items-to-files",
  {
    input: MediaItemDownloadRequestedResponse.pick("files"),
    output: type({
      episodes: {
        "[string]": DebridFile,
      },
      movies: {
        "[string]": DebridFile,
      },
    }),
  },
);

export type MapItemsToFilesSandboxedJob =
  typeof MapItemsToFilesSandboxedJob.infer;

export const mapItemsToFilesProcessorSchema =
  MapItemsToFilesSandboxedJob.get("processor");

export const createMapItemsToFilesJob = createFlowJobBuilder(
  MapItemsToFilesSandboxedJob,
);
