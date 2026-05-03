import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";
import { isZodErrorLike } from "zod-validation-error";

import { services } from "../../database/database.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { isHiddenPath } from "../utilities/is-hidden-path.ts";
import { isIgnoredPath } from "../utilities/is-ignored-path.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

export const getattrSync = function (path, callback) {
  void withVfsScope(async () => {
    try {
      const cachedAttr = attrCache.get(path);

      if (cachedAttr) {
        logger.silly(`VFS getattr: Cache hit for path ${path}`);

        process.nextTick(callback, null, cachedAttr);

        return;
      }

      if (isHiddenPath(path) || isIgnoredPath(path)) {
        logger.silly(`VFS getattr: Skipping hidden/ignored path ${path}`);

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      const attrs = await services.vfsService.getEntryStat(path);

      attrCache.set(path, attrs);

      logger.silly(`VFS getattr: Cache miss for path ${path}`);

      process.nextTick(callback, null, attrs);
    } catch (error) {
      if (isFuseError(error)) {
        logger.error("VFS getattr FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      if (isZodErrorLike(error)) {
        logger.error("VFS getattr validation error", { err: error });

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      logger.error("Unexpected VFS getattr error", { err: error });

      process.nextTick(callback, Fuse.EIO);
    }
  });
} satisfies OPERATIONS["getattr"];
