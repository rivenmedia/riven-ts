import { createSandboxedJobProcessor } from "../../utilities/create-sandboxed-job.processor.ts";
import {
  MapItemsToFilesSandboxedJob,
  mapItemsToFilesProcessorSchema,
} from "./map-items-to-files.schema.ts";
import { mapItemsToFiles } from "./utilities/map-items-to-files.ts";

export default createSandboxedJobProcessor(
  MapItemsToFilesSandboxedJob,
  mapItemsToFilesProcessorSchema.implementAsync(function ({ job }) {
    return mapItemsToFiles(job.data.files);
  }),
);
