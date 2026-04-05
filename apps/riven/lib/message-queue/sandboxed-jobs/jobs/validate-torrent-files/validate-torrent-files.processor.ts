import { UnrecoverableError } from "bullmq";

import { createSandboxedJobProcessor } from "../../utilities/create-sandboxed-job.processor.ts";

export default createSandboxedJobProcessor(
  "download-item.validate-torrent-files",
  async function ({ job }) {
    const [mapItemsToFilesResult] = Object.values(
      await job.getChildrenValues(),
    );

    if (!mapItemsToFilesResult) {
      throw new UnrecoverableError(
        `Missing mapped items to files result for job ${job.id}`,
      );
    }

    const { withORM } = await import("../../utilities/with-orm.ts");

    return withORM(async (database) => {
      const item = await database.mediaItem.findOneOrFail(job.data.id);

      const { InvalidTorrentError, validateTorrentFiles } =
        await import("./utilities/validate-torrent-files.ts");

      try {
        const result = await validateTorrentFiles(
          item,
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
    });
  },
);
