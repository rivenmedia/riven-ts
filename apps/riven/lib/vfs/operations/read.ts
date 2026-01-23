import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { Writable } from "node:stream";
import shm from "shm-typed-array";

import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { Chunk } from "../schemas/chunk.schema.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import { fdToFileHandleMeta } from "../utilities/file-handle-map.ts";

interface ReadInput {
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
      Fuse.ENOENT,
      `Invalid file handle for read: ${fd.toString()}`,
    );
  }

  const chunkSize = 1024 * 1024;
  const {
    chunks,
    chunkRange: [chunkStart, chunkEnd],
    chunksRequired,
    firstChunk,
    lastChunk,
    // bytesRequired,
  } = calculateChunkRange({
    fileId: fileHandle.fileId,
    chunkSize,
    fileSize: Number(fileHandle.fileSize),
    requestRange: [position, position + length - 1],
  });

  const parts: Buffer[] = [];

  for (const chunk of chunks) {
    const maybeCachedChunk = shm.get(chunk.cacheKey, "Buffer");

    if (maybeCachedChunk) {
      parts.push(maybeCachedChunk);
    } else {
      break;
    }
  }

  if (parts.length === chunksRequired) {
    logger.verbose(
      `Cache hit for chunk [${firstChunk.range[0].toString()}-${lastChunk.range[1].toString()}] for fd ${fd.toString()}`,
    );

    const chunk = Buffer.concat(parts);

    chunk.copy(
      buffer,
      0,
      position - chunkStart,
      position - chunkStart + length,
    );

    return length;
  }

  const missingChunks = chunks.slice(parts.length);
  const bytesRequired = missingChunks.length * chunkSize;

  logger.verbose(
    `Cache miss for chunk [${missingChunks[0]?.cacheKey ?? "Unknown"}] for fd ${fd.toString()}`,
  );

  console.log(
    `Fetching bytes=${(chunkStart + parts.reduce((acc, part) => acc + part.byteLength, 0)).toString()}-${chunkEnd.toString()}`,
  );

  const { pathname, origin } = new URL(fileHandle.url);
  const { opaque } = await fileHandle.client.stream(
    {
      method: "GET",
      origin,
      path: pathname,
      opaque: buffer,
      highWaterMark: bytesRequired,
      blocking: false,
      headers: {
        "accept-encoding": "identity",
        connection: "keep-alive",
        range: `bytes=${(chunkStart + parts.reduce((acc, part) => acc + part.byteLength, 0)).toString()}-${chunkEnd.toString()}`,
      },
    },
    ({ opaque }) => {
      return new Writable({
        write(part: Buffer, _encoding, callback) {
          parts.push(part);

          callback();
        },
        final(callback) {
          const chunk = Buffer.concat(parts);

          for (let start = 0; start < bytesRequired; start += chunkSize) {
            const cacheChunk = chunk.subarray(start, start + chunkSize);
            const chunkMeta = Chunk.parse({
              fileId: fileHandle.fileId,
              start: chunkStart + start,
              end: Math.min(chunkStart + start + chunkSize - 1, chunkEnd),
            });

            logger.silly(`Caching chunk ${chunkMeta.cacheKey}`);

            shm
              .create(cacheChunk.length, "Buffer", chunkMeta.cacheKey)
              ?.set(cacheChunk);
          }

          logger.verbose(
            `Fetched chunk [${chunks[0].cacheKey}] for fd ${fd.toString()}`,
          );

          chunk.copy(
            opaque,
            0,
            position - chunkStart,
            position - chunkStart + length,
          );

          callback();
        },
      });
    },
  );

  return opaque.length;
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

      logger.error(`VFS read unknown error: ${(error as Error).stack}`);

      callback(Fuse.EIO);
    });
} satisfies OPERATIONS["read"];
