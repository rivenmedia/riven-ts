import { NotFoundError } from "@mikro-orm/core";
import Fuse from "@zkochan/fuse-native";
import { isZodErrorLike } from "zod-validation-error";

import { services } from "../../database/database.ts";
import { logger } from "../../utilities/logger/logger.ts";
import { FuseError, isFuseError } from "../errors/fuse-error.ts";
import { attrCache } from "../utilities/attr-cache.ts";
import { isHiddenPath } from "../utilities/is-hidden-path.ts";
import { isSupportedExtension } from "../utilities/is-supported-extension.ts";
import { withVfsOperationContext } from "../utilities/vfs-operation-context.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const getattrSync = function getattrSync(path, callback) {
  void withVfsScope(async () =>
    withVfsOperationContext({ operationName: "getattr", path }, async () => {
      const cachedAttr = attrCache.get(path);

      if (cachedAttr) {
        logger.silly(`VFS getattr: Cache hit for path ${path}`);

        process.nextTick(callback, null, cachedAttr);

        return;
      }

      if (isHiddenPath(path)) {
        logger.silly(`VFS getattr: Skipping hidden path ${path}`);

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      if (!isSupportedExtension(path)) {
        logger.silly(`VFS getattr: Unsupported extension for path ${path}`);

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      try {
        const attrs = await services.vfsService.getEntryStat(path);

        attrCache.set(path, attrs);

        logger.silly(`VFS getattr: Cache miss for path ${path}`);

        process.nextTick(callback, null, attrs);
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new FuseError(Fuse.ENOENT, "File not found");
        }

        throw error;
      }
    }).catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error("VFS getattr FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      if (isZodErrorLike(error)) {
        logger.error(`VFS getattr validation error for path ${path}`, {
          err: error,
        });

        process.nextTick(callback, Fuse.ENOENT);

        return;
      }

      logger.error(`Unexpected VFS getattr error for path ${path}`, {
        err: error,
      });

      process.nextTick(callback, Fuse.EIO);
    }),
  );
} satisfies OPERATIONS["getattr"];
