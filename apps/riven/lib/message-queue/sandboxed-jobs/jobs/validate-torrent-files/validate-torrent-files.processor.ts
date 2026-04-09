import { UnrecoverableError } from "bullmq";

import { createSandboxedJobProcessor } from "../../utilities/create-sandboxed-job.processor.ts";
import {
  InvalidTorrentError,
  validateTorrentFiles,
} from "./utilities/validate-torrent-files.ts";
import {
  ValidateTorrentFilesSandboxedJob,
  validateTorrentFilesProcessorSchema,
} from "./validate-torrent-files.schema.ts";

export default createSandboxedJobProcessor(
  ValidateTorrentFilesSandboxedJob,
  validateTorrentFilesProcessorSchema.implementAsync(async function ({ job }) {
    const [mapItemsToFilesResult] = Object.values(
      await job.getChildrenValues(),
    );

    if (!mapItemsToFilesResult) {
      throw new UnrecoverableError(
        `Missing mapped items to files result for job ${job.id}`,
      );
    }

    try {
      const result = await validateTorrentFiles(
        job.data.id,
        job.data.infoHash,
        mapItemsToFilesResult,
        job.data.isCacheCheck,
      );

      return {
        success: true,
        files: result,
      };
    } catch (error) {
      if (error instanceof InvalidTorrentError) {
        return {
          success: false,
          reason: error.message,
        };
      }

      throw error;
    }
  }),
);
