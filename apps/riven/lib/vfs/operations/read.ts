import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { Writable } from "node:stream";

import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { calculateChunkRange } from "../utilities/chunks/calculate-chunk-range.ts";
import { fdToFileHandleMeta } from "../utilities/file-handle-map.ts";

// import { pathToFileHandleMeta } from "../utilities/file-handle-map.ts";

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

  const {
    cacheKey,
    chunkRange: [chunkStart],
  } = calculateChunkRange({
    chunkSize: 1024 * 1024,
    fileSize: Number(fileHandle.fileSize),
    requestRange: [position, position + length - 1],
  });

  const maybeCachedChunk = fileHandle.cache.get(cacheKey);

  if (maybeCachedChunk) {
    logger.verbose(`Cache hit for chunk [${cacheKey}] for fd ${fd.toString()}`);

    Buffer.concat(maybeCachedChunk).copy(
      buffer,
      0,
      position - chunkStart,
      position - chunkStart + length,
    );

    return length;
  }

  const parts: Buffer[] = [];

  const { opaque } = await fileHandle.client.stream(
    {
      method: "GET",
      path: fileHandle.pathname,
      highWaterMark: length,
      opaque: buffer,
      // reset: true,
      headers: {
        "accept-encoding": "identity",
        connection: "keep-alive",
        range: `bytes=${cacheKey}`,
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

          logger.verbose(`Fetched chunk [${cacheKey}] for fd ${fd.toString()}`);

          fileHandle.cache.set(cacheKey, parts);

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

      logger.error(`VFS read unknown error: ${String(error)}`);

      callback(Fuse.EIO);
    });
} satisfies OPERATIONS["read"];
