import { mapItemsToFilesProcessorSchema } from "./map-items-to-files.schema.ts";
import { mapItemsToFiles } from "./utilities/map-items-to-files.ts";

export const mapItemsToFilesProcessor =
  mapItemsToFilesProcessorSchema.implementAsync(function ({ job }) {
    return mapItemsToFiles(job.data.files);
  });
