import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";

import { services } from "../../database/database.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

export const readDirSync = function (path, callback) {
  void withVfsScope(async () => {
    try {
      const data = await services.vfsService.getDirectoryEntryPaths(path);

      process.nextTick(callback, 0, data);
    } catch (error) {
      if (isFuseError(error)) {
        logger.error("VFS readdir FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error("Unexpected VFS readdir error", { err: error });

      process.nextTick(callback, Fuse.EIO);
    }
  });
} satisfies OPERATIONS["readdir"];
