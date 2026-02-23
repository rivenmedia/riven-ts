import Fuse from "@zkochan/fuse-native";

import { logger } from "../../utilities/logger/logger.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponsePromiseMap,
  fileNameIsFetchingLinkMap,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

async function release(_path: string, fd: number) {
  const response = await fdToResponsePromiseMap.get(fd);

  if (response) {
    response.body.destroy();
  }

  const fileHandleMeta = fdToFileHandleMeta.get(fd);

  // Clean up all fd-related mappings related to this file descriptor.
  // The chunk calculations map is intentionally omitted, as it can be reused by other
  // file descriptors opening the same file.
  [
    fdToFileHandleMeta,
    fdToResponsePromiseMap,
    fdToCurrentStreamPositionMap,
    fdToPreviousReadPositionMap,
  ].forEach((map) => {
    map.delete(fd);
  });

  if (!fileHandleMeta) {
    logger.warn(
      `Released unknown file for fd ${fd.toString()}. It may have been already released or never opened successfully.`,
    );

    return;
  }

  const nextFdCount =
    (fileNameToFdCountMap.get(fileHandleMeta.originalFileName) ?? 1) - 1;

  if (nextFdCount > 0) {
    fileNameToFdCountMap.set(fileHandleMeta.originalFileName, nextFdCount);
  } else {
    fileNameToFdCountMap.delete(fileHandleMeta.originalFileName);

    // If there are no more file descriptors referencing this file,
    // we can clean up the file-name based mappings as well to free up memory.
    [fileNameToFileChunkCalculationsMap, fileNameIsFetchingLinkMap].forEach(
      (map) => {
        map.delete(fileHandleMeta.originalFileName);
      },
    );
  }

  logger.verbose(
    `Released "${fileHandleMeta.fileBaseName}" [fd=${fd.toString()}] successfully.`,
  );
}

export const releaseSync = function (_path, fd, callback) {
  release(_path, fd)
    .then(() => {
      process.nextTick(callback, 0);
    })
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS release FuseError: ${error.message}`);

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`VFS release unknown error: ${String(error)}`);

      process.nextTick(callback, Fuse.EIO);
    });
} satisfies OPERATIONS["release"];
