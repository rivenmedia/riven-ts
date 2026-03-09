import { UnrecoverableError } from "bullmq";

import { mapItemsToFilesProcessorSchema } from "./map-items-to-files.schema.ts";
import { mapItemsToFiles } from "./utilities/map-items-to-files.ts";

export const mapItemsToFilesProcessor =
  mapItemsToFilesProcessorSchema.implementAsync(async function ({ job }) {
    const [torrentContainer] = Object.values(await job.getChildrenValues());

    if (!torrentContainer) {
      throw new UnrecoverableError(
        "Unable to map items to files without a valid torrent container.",
      );
    }

    return {
      ...torrentContainer,
      files: mapItemsToFiles(torrentContainer.files),
    };
  });
