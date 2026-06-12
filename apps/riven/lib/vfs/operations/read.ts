import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import Undici from "undici";

import { logger } from "../../utilities/logger/logger.ts";
import { config } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { SeekDetected } from "../errors/seek-detected.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import { fetchDiscreteByteRange } from "../utilities/chunks/fetch-discrete-byte-range.ts";
import { detectReadType } from "../utilities/detect-read-type.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponsePromiseMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { performBodyRead } from "../utilities/read-types/perform-body-read.ts";
import { performCacheHit } from "../utilities/read-types/perform-cache-hit.ts";
import {
  getVfsOperationContext,
  withVfsOperationContext,
} from "../utilities/vfs-operation-context.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

async function read() {
  const {
    buffer,
    fd,
    length,
    position,
    context: {
      fileHandleMetadata,
      previousReadPosition,
      currentStreamPosition,
    },
  } = getVfsOperationContext("read");

  // Subtitle files are served directly from an in-memory buffer
  if (fileHandleMetadata.type === "subtitle") {
    const end = Math.min(
      position + length,
      fileHandleMetadata.contentBuffer.length,
    );
    const bytesRead = end - position;

    if (bytesRead <= 0) {
      return 0;
    }

    fileHandleMetadata.contentBuffer.copy(buffer, 0, position, end);

    return bytesRead;
  }

  const fileChunkCalculations = fileNameToFileChunkCalculationsMap.get(
    fileHandleMetadata.originalFileName,
  );

  if (!fileChunkCalculations) {
    throw new FuseError(Fuse.EBADF, "Missing chunk calculations");
  }

  const {
    chunks,
    firstChunk: {
      range: [chunkStart],
    },
  } = calculateChunkRange({
    chunkSize: config.chunkSize,
    fileSize: fileHandleMetadata.fileSize,
    requestRange: [position, position + length - 1],
    fileName: fileHandleMetadata.originalFileName,
  });

  const readType = detectReadType(
    previousReadPosition,
    chunks,
    length,
    fileChunkCalculations,
  );

  logger.silly(
    [
      `fd=${fd.toString()}`,
      `read-type=${readType}`,
      `range=${position.toString()}-${(position + length - 1).toString()}`,
      `length=${length.toString()}`,
      `position=${position.toString()}`,
      `previous=${previousReadPosition?.toString() ?? "N/A"}`,
      `diff=${previousReadPosition !== undefined ? (position - previousReadPosition).toString() : "N/A"}`,
      `current-stream-position=${currentStreamPosition?.toString() ?? "N/A"}`,
    ].join(" | "),
  );

  switch (readType) {
    case "header-scan": {
      const data = await fetchDiscreteByteRange(
        fileHandleMetadata,
        fileChunkCalculations.headerChunk.range,
      );

      data.copy(
        buffer,
        0,
        position - fileChunkCalculations.headerChunk.range[0],
        position - fileChunkCalculations.headerChunk.range[0] + length,
      );

      break;
    }

    // Note: if the read type is footer_read, the footer cache chunk
    // has likely expired and the player is nearing EOF.
    // In this case, we will re-download the entire footer and serve the rest from cache.
    //
    // This can happen if the user's cache size is small,
    // or during heavy scans with lots of competing streams.
    case "footer-read":
    case "footer-scan": {
      const data = await fetchDiscreteByteRange(
        fileHandleMetadata,
        fileChunkCalculations.footerChunk.range,
      );

      data.copy(
        buffer,
        0,
        position - fileChunkCalculations.footerChunk.range[0],
        position - fileChunkCalculations.footerChunk.range[0] + length,
      );

      break;
    }

    case "general-scan": {
      const scannedChunk = await fetchDiscreteByteRange(
        fileHandleMetadata,
        [position, position + length - 1],
        false,
      );

      scannedChunk.copy(buffer);

      break;
    }

    case "body-read": {
      const data = await performBodyRead(chunks);

      data.copy(
        buffer,
        0,
        position - chunkStart,
        position - chunkStart + length,
      );

      break;
    }

    case "cache-hit": {
      const data = performCacheHit(chunks);

      data.copy(
        buffer,
        0,
        position - chunkStart,
        position - chunkStart + length,
      );

      break;
    }
  }

  fdToPreviousReadPositionMap.set(fd, position);

  return length;
}

export const readSync = function (
  path,
  fd,
  buffer,
  length,
  position,
  callback,
) {
  void withVfsScope(async () => {
    const fileHandleMetadata = fdToFileHandleMeta.get(fd);

    if (!fileHandleMetadata) {
      throw new FuseError(Fuse.EBADF, "Invalid file handle");
    }

    await withVfsOperationContext(
      {
        operationName: "read",
        path,
        fd,
        buffer,
        length,
        position,
        context: {
          fileHandleMetadata,
          previousReadPosition: fdToPreviousReadPositionMap.get(fd),
          get currentStreamPosition() {
            return fdToCurrentStreamPositionMap.get(fd);
          },
          responsePromise: fdToResponsePromiseMap.get(fd),
          seekController: new AbortController(),
        },
      },
      async () => {
        const bytesRead = await read();

        process.nextTick(callback, bytesRead);
      },
    );
  }).catch((error: unknown) => {
    // This is triggered when a file handle is released
    if (error instanceof Undici.errors.RequestAbortedError) {
      logger.silly(`Read operation aborted for fd ${fd.toString()}`);

      process.nextTick(callback, 0);

      return;
    }

    if (isFuseError(error)) {
      if (!(error instanceof SeekDetected)) {
        logger.error("VFS read FuseError", { err: error });
      }

      process.nextTick(callback, error.errorCode);

      return;
    }

    logger.error(`Unexpected VFS read error for path: ${path}`, {
      err: error,
    });

    process.nextTick(callback, Fuse.EIO);
  });
} satisfies OPERATIONS["read"];
