import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import Undici from "undici";

import { logger } from "../../utilities/logger/logger.ts";
import { config } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import { fetchDiscreteByteRange } from "../utilities/chunks/fetch-discrete-byte-range.ts";
import { detectReadType } from "../utilities/detect-read-type.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
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
  const { buffer, fd, length, position } = getVfsOperationContext("read");
  const fileHandle = fdToFileHandleMeta.get(fd);

  if (!fileHandle) {
    throw new FuseError(Fuse.EBADF, "Invalid file handle");
  }

  // Subtitle files are served directly from an in-memory buffer
  if (fileHandle.type === "subtitle") {
    const end = Math.min(position + length, fileHandle.contentBuffer.length);
    const bytesRead = end - position;

    if (bytesRead <= 0) {
      return 0;
    }

    fileHandle.contentBuffer.copy(buffer, 0, position, end);

    return bytesRead;
  }

  const fileChunkCalculations = fileNameToFileChunkCalculationsMap.get(
    fileHandle.originalFileName,
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
    fileSize: fileHandle.fileSize,
    requestRange: [position, position + length - 1],
    fileName: fileHandle.originalFileName,
  });

  const previousReadPosition = fdToPreviousReadPositionMap.get(fd);

  const readType = detectReadType(
    previousReadPosition,
    chunks,
    length,
    fileChunkCalculations,
  );

  const currentStreamPosition = fdToCurrentStreamPositionMap.get(fd);

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

  // Copy a slice of `data` to `buffer` while staying within `data`'s
  // bounds. If the fetched chunk is shorter than the requested range
  // (e.g. the read crosses past where this chunk's bytes actually end,
  // or near EOF), Buffer.copy throws `RangeError [ERR_OUT_OF_RANGE]`.
  // Clamp both ends and return the number of bytes actually copied so
  // FUSE can short-read instead of erroring out the whole operation.
  const safeCopy = (data: Buffer, sourceStart: number) => {
    const clampedStart = Math.max(0, Math.min(sourceStart, data.length));
    const clampedEnd = Math.max(
      clampedStart,
      Math.min(clampedStart + length, data.length),
    );

    data.copy(buffer, 0, clampedStart, clampedEnd);

    return clampedEnd - clampedStart;
  };

  let bytesRead = length;

  switch (readType) {
    case "header-scan": {
      const data = await fetchDiscreteByteRange(
        fileHandle,
        fileChunkCalculations.headerChunk.range,
      );

      bytesRead = safeCopy(
        data,
        position - fileChunkCalculations.headerChunk.range[0],
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
        fileHandle,
        fileChunkCalculations.footerChunk.range,
      );

      bytesRead = safeCopy(
        data,
        position - fileChunkCalculations.footerChunk.range[0],
      );

      break;
    }

    case "general-scan": {
      const scannedChunk = await fetchDiscreteByteRange(
        fileHandle,
        [position, position + length - 1],
        false,
      );

      bytesRead = safeCopy(scannedChunk, 0);

      break;
    }

    case "body-read": {
      const data = await performBodyRead(chunks, fileHandle);

      bytesRead = safeCopy(data, position - chunkStart);

      break;
    }

    case "cache-hit": {
      const data = performCacheHit(chunks);

      bytesRead = safeCopy(data, position - chunkStart);

      break;
    }
  }

  fdToPreviousReadPositionMap.set(fd, position);

  return bytesRead;
}

export const readSync = function (
  path,
  fd,
  buffer,
  length,
  position,
  callback,
) {
  void withVfsScope(() =>
    withVfsOperationContext(
      {
        operationName: "read",
        path,
        fd,
        buffer,
        length,
        position,
      },
      async () => {
        const bytesRead = await read();

        process.nextTick(callback, bytesRead);
      },
    ).catch((error: unknown) => {
      console.log({ error });
      // This is triggered when a file handle is released
      if (error instanceof Undici.errors.RequestAbortedError) {
        logger.silly(`Read operation aborted for fd ${fd.toString()}`);

        process.nextTick(callback, 0);

        return;
      }

      if (isFuseError(error)) {
        logger.error("VFS read FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`Unexpected VFS read error for path: ${path}`, {
        err: error,
      });

      process.nextTick(callback, Fuse.EIO);
    }),
  );
} satisfies OPERATIONS["read"];
