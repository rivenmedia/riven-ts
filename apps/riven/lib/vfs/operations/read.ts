import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { Buffer } from "node:buffer";

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

export interface ReadInput {
  buffer: Buffer;
  path: string;
  fd: number;
  length: number;
  position: number;
}

async function read({ fd, length, position, buffer }: ReadInput) {
  const previousReadPosition = fdToPreviousReadPositionMap.get(fd);

  const fileHandle = fdToFileHandleMeta.get(fd);

  if (!fileHandle) {
    throw new FuseError(
      Fuse.EBADF,
      `Invalid file handle for read: ${fd.toString()}`,
    );
  }

  const fileChunkCalculations = fileNameToFileChunkCalculationsMap.get(
    fileHandle.fileName,
  );

  if (!fileChunkCalculations) {
    throw new FuseError(
      Fuse.EBADF,
      `Missing chunk calculations for file handle: ${fd.toString()}`,
    );
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
    fileName: fileHandle.fileName,
  });

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

  switch (readType) {
    case "header-scan": {
      const data = await fetchDiscreteByteRange(
        fileHandle,
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
        fileHandle,
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
        fileHandle,
        [position, position + length - 1],
        false,
      );

      scannedChunk.copy(buffer);

      break;
    }

    case "body-read": {
      const data = await performBodyRead(fd, chunks, fileHandle);

      data.copy(
        buffer,
        0,
        position - chunkStart,
        position - chunkStart + length,
      );

      break;
    }

    case "cache-hit": {
      const data = performCacheHit(fd, chunks);

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
  read({
    buffer,
    path,
    fd,
    length,
    position,
  })
    .then((bytesRead) => {
      process.nextTick(callback, bytesRead);
    })
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS read FuseError: ${error.message}`);

        process.nextTick(callback, error.errorCode);

        return;
      }

      if (error instanceof Error) {
        logger.error(`VFS read Error: ${error.stack ?? error.message}`);
      } else {
        logger.error(`VFS read unknown error: ${String(error)}`);
      }

      process.nextTick(callback, Fuse.EIO);
    });
} satisfies OPERATIONS["read"];
