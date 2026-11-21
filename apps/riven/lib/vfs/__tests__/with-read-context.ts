import { Buffer } from "node:buffer";

import { fdToCurrentStreamPositionMap } from "#vfs/utilities/file-handle-map.ts";
import { withVfsOperationContext } from "#vfs/utilities/vfs-operation-context.ts";

import type { FileHandleMetadata } from "#vfs/utilities/file-handle-map.ts";
import type { Dispatcher } from "undici";

interface ReadContextOptions {
  fd?: number;
  responsePromise?: Promise<Dispatcher.ResponseData>;
  seekController?: AbortController;
  fileHandleMetadata?: FileHandleMetadata;
}

/**
 * Runs the callback inside a VFS read operation context for a media file.
 */
export const withReadContext = async <T>(
  callback: () => Promise<T> | T,
  {
    fd = 1,
    responsePromise,
    seekController = new AbortController(),
    fileHandleMetadata = {
      type: "media",
      fileSize: 1024,
      filePath: "/movies/movie.mkv",
      fileBaseName: "movie.mkv",
      originalFileName: "movie.mkv",
      url: "http://example.com/movie.mkv",
    },
  }: ReadContextOptions = {},
) =>
  withVfsOperationContext(
    {
      operationName: "read",
      path: fileHandleMetadata.filePath,
      fd,
      buffer: Buffer.alloc(0),
      length: 0,
      position: 0,
      context: {
        fileHandleMetadata,
        previousReadPosition: undefined,
        get currentStreamPosition() {
          return fdToCurrentStreamPositionMap.get(fd);
        },
        responsePromise,
        seekController,
      },
    },
    async () => callback(),
  );
