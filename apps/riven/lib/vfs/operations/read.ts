import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { Writable } from "node:stream";

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
    throw new Error(`Invalid file handle for read: ${fd.toString()}`);
  }

  const chunks: Buffer[] = [];

  const [requestStart, requestEnd] = [
    position,
    Math.min(position + length - 1, fileHandle.fileSize - 1),
  ];

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
        range: `bytes=${requestStart.toString()}-${requestEnd.toString()}`,
      },
    },
    ({ opaque }) => {
      return new Writable({
        write(chunk: Buffer, _encoding, callback) {
          chunks.push(chunk);

          callback();
        },
        final(callback) {
          Buffer.concat(chunks).copy(opaque);

          callback();
        },
      });
    },
  );

  // console.log("read", {
  //   // opaque,
  //   // trailers,
  //   path,
  //   fd,
  //   length,
  //   position,
  // });

  // console.log("request size", length);
  // console.log("opaque length", opaque.length);

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
      if (error instanceof Error) {
        logger.error(`VFS read error: ${error.message}`);

        if (error.cause === Fuse.ENOENT) {
          callback(Fuse.ENOENT);

          return;
        }
      }

      logger.error(`VFS read unknown error: ${String(error)}`);

      callback(Fuse.EIO);
    });
} satisfies OPERATIONS["read"];
