import { fdToFileHandleMeta } from "../utilities/file-handle-map.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const releaseSync = function (_path, fd, callback) {
  async function release() {
    const fileHandle = fdToFileHandleMeta.get(fd);

    if (fileHandle) {
      await fileHandle.client.close();
    }

    fdToFileHandleMeta.delete(fd);
  }

  release()
    .then(callback.bind(null, 0))
    .catch((error: unknown) => {
      console.error("Error during release:", error);
    });
} satisfies OPERATIONS["release"];
