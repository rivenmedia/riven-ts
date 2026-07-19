import Fuse from "@zkochan/fuse-native";

import { services } from "../../database/database.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import { withVfsOperationContext } from "../utilities/vfs-operation-context.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const readDirSync = function (path, callback) {
  void withVfsScope(async () =>
    withVfsOperationContext({ operationName: "readdir", path }, async () => {
      const data = await services.vfsService.getDirectoryEntryPaths(path);

      process.nextTick(callback, 0, data);
    }).catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error("VFS readdir FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`Unexpected VFS readdir error for path: ${path}`, {
        err: error,
      });

      process.nextTick(callback, Fuse.EIO);
    }),
  );
} satisfies OPERATIONS["readdir"];
