import { logger } from "@repo/core-util-logger";
import { benchmark } from "@repo/util-plugin-sdk/helpers/benchmark";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { setTimeout } from "node:timers/promises";
import shm from "shm-typed-array";

import { CHUNK_SIZE } from "../config.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import {
  type FileHandleMetadata,
  fdToFileHandleMeta,
  fdToResponseMap,
} from "../utilities/file-handle-map.ts";
import { requestAgent } from "../utilities/request-agent.ts";

interface ReadInput {
  buffer: Buffer;
  path: string;
  fd: number;
  length: number;
  position: number;
}

async function createRequest(
  fileHandle: FileHandleMetadata,
  requestStart: number,
  requestEnd?: number,
) {
  const { pathname, origin } = new URL(fileHandle.url);

  const range = `bytes=${requestStart.toString()}-${requestEnd?.toString() ?? ""}`;

  return requestAgent.request({
    method: "GET",
    origin,
    path: pathname,
    highWaterMark: CHUNK_SIZE,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range,
    },
  });
}

async function read({ fd, length, position, buffer }: ReadInput) {
  const fileHandle = fdToFileHandleMeta.get(fd);

  if (!fileHandle) {
    throw new FuseError(
      Fuse.EBADF,
      `Invalid file handle for read: ${fd.toString()}`,
    );
  }

  const {
    chunks,
    chunkRange: [chunkStart],
    chunksRequired,
    firstChunk,
    lastChunk,
  } = calculateChunkRange({
    fileId: fileHandle.fileId,
    chunkSize: CHUNK_SIZE,
    fileSize: Number(fileHandle.fileSize),
    requestRange: [position, position + length - 1],
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
    logger.verbose(
      `Cache hit for chunk [${firstChunk.range[0].toString()}-${lastChunk.range[1].toString()}] for fd ${fd.toString()}`,
    );

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
    (await createRequest(
      fileHandle,
      chunkStart + cachedChunks.reduce((acc, part) => acc + part.byteLength, 0),
    ));

  if (!fdToResponseMap.has(fd)) {
    fdToResponseMap.set(fd, streamReader);
  }

  const missingChunks = chunks.slice(cachedChunks.length);

  logger.verbose(
    `Cache miss for chunk [${missingChunks[0]?.cacheKey ?? "Unknown"}] for fd ${fd.toString()}`,
  );

  // If the requested chunk is within the last 10MB of the file, do a discrete fetch.
  // Streams can't skip forwards, so this allows the main stream to remain open for other reads.
  if (
    missingChunks[0] &&
    missingChunks[0].range[0] >= fileHandle.fileSize - CHUNK_SIZE * 10
  ) {
    logger.verbose(
      `Footer read detected for fd ${fd.toString()}, using discrete fetch`,
    );

    const response = await createRequest(
      fileHandle,
      missingChunks[0].range[0],
      missingChunks[missingChunks.length - 1]?.range[1],
    );

    const chunk = await response.body.arrayBuffer();

    const bufferChunk = Buffer.from(chunk);

    bufferChunk.copy(
      buffer,
      0,
      position - chunkStart,
      position - chunkStart + length,
    );

    return length;
  }

  const fetchedChunks: Buffer[] = [];

  const { timeTaken, result: bytesFetched } = await benchmark(async () => {
    let bytesFetched = 0;
    let [targetChunk] = missingChunks;

    if (!targetChunk) {
      logger.warn(`No missing chunks found for fd ${fd.toString()}`);

      return 0;
    }

    while (fetchedChunks.length < missingChunks.length) {
      const readChunk = streamReader.body.read(
        targetChunk.size,
      ) as Buffer | null;

      if (readChunk !== null) {
        bytesFetched += readChunk.byteLength;

        fetchedChunks.push(readChunk);

        shm
          .create(readChunk.length, "Buffer", targetChunk.cacheKey)
          ?.set(readChunk);

        const nextChunk = missingChunks.shift();

        if (!nextChunk) {
          break;
        }

        targetChunk = nextChunk;
      }

      if (fetchedChunks.length === missingChunks.length) {
        break;
      }

      await setTimeout(50);
    }

    return bytesFetched;
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
