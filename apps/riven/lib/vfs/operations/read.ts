import { logger } from "@repo/core-util-logger";
import { benchmark } from "@repo/util-plugin-sdk/helpers/benchmark";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import shm from "shm-typed-array";

import { config } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import { fetchDiscreteByteRange } from "../utilities/chunks/fetch-discrete-byte-range.ts";
import { scanChunk } from "../utilities/chunks/scan-chunk.ts";
import { waitForChunk } from "../utilities/chunks/wait-for-chunk.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponseMap,
  fileNameToFileChunkCalculationsMap,
} from "../utilities/file-handle-map.ts";
import { createStreamRequest } from "../utilities/requests/create-stream-request.ts";

export interface ReadInput {
  buffer: Buffer;
  path: string;
  fd: number;
  length: number;
  position: number;
}

async function read({ fd, length, position, buffer }: ReadInput) {
  const previousReadPosition = fdToPreviousReadPositionMap.get(fd);

  fdToPreviousReadPositionMap.set(fd, position);

  logger.silly(
    `[${fd.toString()}] Read request: range=${position.toString()}-${(position + length).toString()} length=${length.toString()} position=${position.toString()} previous=${previousReadPosition?.toString() ?? "N/A"} diff=${previousReadPosition !== undefined ? (position - previousReadPosition).toString() : "N/A"}`,
  );

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
    chunksRequired,
    rangeLabel,
  } = calculateChunkRange({
    fileId: fileHandle.fileId,
    chunkSize: config.chunkSize,
    fileSize: Number(fileHandle.fileSize),
    requestRange: [position, position + length - 1],
    fileName: fileHandle.fileName,
  });

  const cachedChunks: Buffer[] = [];

  for (const chunk of chunks) {
    const maybeCachedChunk = shm.get(chunk.cacheKey, "Buffer");

    if (maybeCachedChunk) {
      cachedChunks.push(maybeCachedChunk);
    } else {
      break;
    }
  }

  if (cachedChunks.length === chunksRequired) {
    logger.silly(`Cache hit for ${rangeLabel} for fd ${fd.toString()}`);

    const chunk = Buffer.concat(cachedChunks);

    chunk.copy(
      buffer,
      0,
      position - chunkStart,
      position - chunkStart + length,
    );

    return length;
  }

  const missingChunks = chunks.slice(cachedChunks.length);

  if (!missingChunks[0]) {
    throw new FuseError(
      Fuse.EIO,
      `No missing chunks calculated for fd ${fd.toString()}`,
    );
  }

  logger.silly(
    `Cache miss for chunk ${missingChunks.map((chunk) => chunk.rangeLabel).join(", ")} for fd ${fd.toString()}`,
  );

  if (missingChunks[0].index === fileChunkCalculations.headerChunk.index) {
    logger.verbose(
      `Header read detected for fd ${fd.toString()}, using discrete fetch`,
    );

    const headerChunk = await scanChunk(
      fileHandle,
      fileChunkCalculations.headerChunk,
      position,
      length,
    );

    headerChunk.copy(buffer);

    return length;
  }

  // Fetch footer chunk via discrete request to avoid disrupting main stream.
  if (missingChunks[0].index === fileChunkCalculations.footerChunk.index) {
    logger.verbose(
      `Footer read detected for fd ${fd.toString()}, using discrete fetch`,
    );

    const footerChunk = await scanChunk(
      fileHandle,
      fileChunkCalculations.footerChunk,
      position,
      length,
    );

    footerChunk.copy(buffer);

    return length;
  }

  if (
    (previousReadPosition !== undefined &&
      Math.abs(previousReadPosition - position) > config.scanToleranceBytes) ||
    (position > fileChunkCalculations.headerChunk.size &&
      previousReadPosition === undefined)
  ) {
    logger.verbose(
      `Scan read detected for fd ${fd.toString()}, using discrete fetch`,
    );

    const scannedChunk = await fetchDiscreteByteRange(
      fileHandle,
      position,
      position + length - 1,
      false,
    );

    scannedChunk.copy(buffer);

    return length;
  }

  const streamReader =
    fdToResponseMap.get(fd) ??
    (await createStreamRequest(
      fileHandle,
      chunkStart + cachedChunks.reduce((acc, part) => acc + part.byteLength, 0),
    ));

  if (!fdToResponseMap.has(fd)) {
    logger.silly(`Storing stream reader for fd ${fd.toString()}`);

    fdToResponseMap.set(fd, streamReader);
  }

  if (!fdToCurrentStreamPositionMap.has(fd)) {
    fdToCurrentStreamPositionMap.set(
      fd,
      chunkStart + cachedChunks.reduce((acc, part) => acc + part.byteLength, 0),
    );
  }

  const currentStreamPosition = fdToCurrentStreamPositionMap.get(fd);

  if (currentStreamPosition === undefined) {
    throw new FuseError(
      Fuse.EIO,
      `Missing current stream position for fd ${fd.toString()}`,
    );
  }

  const {
    timeTaken,
    result: { bytesFetched, fetchedChunks },
  } = await benchmark(async () => {
    const fetchedChunks: Buffer[] = [];
    let bytesFetched = 0;

    for (const targetChunk of missingChunks) {
      const readChunk = await waitForChunk(streamReader.body, targetChunk);

      bytesFetched += readChunk.byteLength;

      fdToCurrentStreamPositionMap.set(
        fd,
        currentStreamPosition + readChunk.byteLength,
      );

      fetchedChunks.push(readChunk);

      shm
        .create(readChunk.byteLength, "Buffer", targetChunk.cacheKey)
        ?.set(readChunk);
    }

    return {
      bytesFetched,
      fetchedChunks,
    };
  });

  logger.verbose(
    `Fetched ${bytesFetched.toString()} bytes in ${timeTaken.toFixed(2)}ms for fd ${fd.toString()}`,
  );

  Buffer.concat([...cachedChunks, ...fetchedChunks]).copy(
    buffer,
    0,
    position - chunkStart,
    position - chunkStart + length,
  );

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
    .then(callback)
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS read FuseError: ${error.message}`);

        callback(error.errorCode);

        return;
      }

      if (error instanceof Error) {
        logger.error(`VFS read Error: ${error.stack ?? error.message}`);
      } else {
        logger.error(`VFS read unknown error: ${String(error)}`);
      }

      callback(Fuse.EIO);
    });
} satisfies OPERATIONS["read"];
