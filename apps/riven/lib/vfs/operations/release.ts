import Fuse from "@zkochan/fuse-native";

import { logger } from "../../utilities/logger/logger.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponseMap,
} from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const releaseSync = function (_path, fd, callback) {
  try {
    fdToResponseMap.get(fd)?.body.destroy();

    // Clean up all mappings related to this file descriptor.
    // The chunk calculations map is intentionally left alone, as it can be reused by other
    // file descriptors opening the same file.
    [
      fdToFileHandleMeta,
      fdToResponseMap,
      fdToPreviousReadPositionMap,
      fdToCurrentStreamPositionMap,
    ].forEach((map) => {
      map.delete(fd);
    });

    logger.silly(`Released file descriptor ${fd.toString()} successfully.`);

    process.nextTick(callback, 0);
  } catch (error: unknown) {
    if (isFuseError(error)) {
      logger.error(`VFS release FuseError: ${error.message}`);

      process.nextTick(callback, error.errorCode);

      return;
    }

    logger.error(`VFS release unknown error: ${String(error)}`);

    process.nextTick(callback, Fuse.EIO);
  }
} satisfies OPERATIONS["release"];
