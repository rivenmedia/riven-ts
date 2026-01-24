import { logger } from "@repo/core-util-logger";
import { benchmark } from "@repo/util-plugin-sdk/helpers/benchmark";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import shm from "shm-typed-array";

import { config } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import { fetchDiscreteByteRange } from "../utilities/chunks/fetch-discrete-byte-range.ts";
import { waitForChunk } from "../utilities/chunks/wait-for-chunk.ts";
import {
  fdToFileHandleMeta,
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
    chunkRange: [chunkStart],
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
    logger.verbose(`Cache hit for ${rangeLabel} for fd ${fd.toString()}`);

    const chunk = Buffer.concat(cachedChunks);

    chunk.copy(
      buffer,
      0,
      position - chunkStart,
      position - chunkStart + length,
    );

    return length;
  }

  const streamReader =
    fdToResponseMap.get(fd) ??
    (await createStreamRequest(
      fileHandle,
      chunkStart + cachedChunks.reduce((acc, part) => acc + part.byteLength, 0),
    ));

  if (!fdToResponseMap.has(fd)) {
    fdToResponseMap.set(fd, streamReader);
  }

  const missingChunks = chunks.slice(cachedChunks.length);

  if (!missingChunks[0]) {
    throw new FuseError(
      Fuse.EIO,
      `No missing chunks calculated for fd ${fd.toString()}`,
    );
  }

  logger.verbose(
    `Cache miss for chunk ${missingChunks[0].rangeLabel} for fd ${fd.toString()}`,
  );

  // If the requested chunk is within the last 10MB of the file, do a discrete fetch.
  // Streams can't skip forwards, so this allows the main stream to remain open for other reads.
  if (
    missingChunks[0].range[0] >=
    Number(fileHandle.fileSize) - config.chunkSize * 10
  ) {
    logger.verbose(
      `Footer read detected for fd ${fd.toString()}, using discrete fetch`,
    );

    const [discreteRequestStart, discreteRequestEnd] = [
      missingChunks[0].range[0],
      missingChunks[missingChunks.length - 1]?.range[1],
    ];

    if (!discreteRequestEnd) {
      throw new FuseError(
        Fuse.EIO,
        `Invalid chunk end for discrete fetch on fd ${fd.toString()}`,
      );
    }

    const chunk = await fetchDiscreteByteRange(
      fileHandle,
      discreteRequestStart,
      discreteRequestEnd,
    );

    const bufferChunk = Buffer.from(chunk);

    bufferChunk.copy(
      buffer,
      0,
      position - chunkStart,
      position - chunkStart + length,
    );

    return length;
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

      fetchedChunks.push(readChunk);

      shm
        .create(readChunk.length, "Buffer", targetChunk.cacheKey)
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
