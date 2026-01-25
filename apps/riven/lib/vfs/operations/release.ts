import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";

import { isFuseError } from "../errors/fuse-error.ts";
import {
  fdToFileHandleMeta,
  fdToPreviousReadPositionMap,
  fdToResponseMap,
} from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const releaseSync = function (_path, fd, callback) {
  // eslint-disable-next-line @typescript-eslint/require-await
  async function release() {
    fdToResponseMap.get(fd)?.body.destroy();

    // Clean up all mappings related to this file descriptor.
    // The chunk calculations map is intentionally left alone, as it can be reused by other
    // file descriptors opening the same file.
    [fdToFileHandleMeta, fdToPreviousReadPositionMap, fdToResponseMap].forEach(
      (map) => {
        map.delete(fd);
      },
    );
  }

  release()
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS release FuseError: ${error.message}`);

        callback(error.errorCode);

        return;
      }

      logger.error(`VFS release unknown error: ${String(error)}`);

      callback(Fuse.EIO);
    });
} satisfies OPERATIONS["release"];
