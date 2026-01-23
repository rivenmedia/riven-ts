import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";

import { isFuseError } from "../errors/fuse-error.ts";
import {
  fdToFileHandleMeta,
  fdToResponseMap,
} from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const releaseSync = function (_path, fd, callback) {
  // eslint-disable-next-line @typescript-eslint/require-await
  async function release() {
    fdToResponseMap.get(fd)?.body.destroy();
    fdToFileHandleMeta.delete(fd);
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
