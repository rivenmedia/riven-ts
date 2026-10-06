import Fuse from "@zkochan/fuse-native";
import Undici from "undici";

import { logger } from "#utilities/logger/logger.ts";
import { isFuseError } from "#vfs/errors/fuse-error.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponsePromiseMap,
  fileNameIsFetchingLinkMap,
  fileNameToFdCountMap,
  fileNameToFileChunkCalculationsMap,
} from "#vfs/utilities/file-handle-map.ts";
import {
  getVfsOperationContext,
  withVfsOperationContext,
} from "#vfs/utilities/vfs-operation-context.ts";
import { withVfsScope } from "#vfs/utilities/with-vfs-scope.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

/**
 * Drains any in-flight response body for the file descriptor so the underlying connection can be released.
 */
async function drainResponse(fd: number) {
  const response = await fdToResponsePromiseMap.get(fd);

  if (!response) {
    return;
  }

  try {
    await response.body.dump();
  } catch (error) {
    /*
     * Intentionally squash AbortError exceptions as they are
     * expected to occur when aborting an in-flight request.
     */
    if (!(error instanceof Undici.errors.RequestAbortedError)) {
      throw error;
    }
  }
}

/**
 * Decrements the file descriptor count for a file,
 * cleaning up the file-name based mappings once no file descriptors reference it.
 */
function releaseFileName(originalFileName: string) {
  const nextFdCount = (fileNameToFdCountMap.get(originalFileName) ?? 1) - 1;

  if (nextFdCount > 0) {
    fileNameToFdCountMap.set(originalFileName, nextFdCount);

    return;
  }

  fileNameToFdCountMap.delete(originalFileName);

  // If there are no more file descriptors referencing this file,
  // we can clean up the file-name based mappings as well to free up memory.
  for (const map of [
    fileNameToFileChunkCalculationsMap,
    fileNameIsFetchingLinkMap,
  ]) {
    map.delete(originalFileName);
  }
}

async function release() {
  const { fd } = getVfsOperationContext("release");

  await drainResponse(fd);

  const fileHandleMeta = fdToFileHandleMeta.get(fd);

  // Clean up all fd-related mappings related to this file descriptor.
  // The chunk calculations map is intentionally omitted, as it can be reused by other
  // file descriptors opening the same file.
  for (const map of [
    fdToFileHandleMeta,
    fdToResponsePromiseMap,
    fdToCurrentStreamPositionMap,
    fdToPreviousReadPositionMap,
  ]) {
    map.delete(fd);
  }

  if (!fileHandleMeta) {
    logger.warn(
      `Released unknown file for fd ${fd.toString()}. It may have been already released or never opened successfully.`,
    );

    return;
  }

  // Subtitle file handles don't use the file-name based maps
  if (fileHandleMeta.type === "media") {
    releaseFileName(fileHandleMeta.originalFileName);
  }

  logger.verbose(
    `Released "${fileHandleMeta.fileBaseName}" [fd=${fd.toString()}] successfully.`,
  );
}

export const releaseSync = function releaseSync(path, fd, callback) {
  void withVfsScope(async () =>
    withVfsOperationContext(
      { operationName: "release", path, fd },
      async () => {
        await release();

        process.nextTick(callback, 0);
      },
    ).catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error("VFS release FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`Unexpected VFS release error for path: ${path}`, {
        err: error,
      });

      process.nextTick(callback, Fuse.EIO);
    }),
  );
} satisfies OPERATIONS["release"];
