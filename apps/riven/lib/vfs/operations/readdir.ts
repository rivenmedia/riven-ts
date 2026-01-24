import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";

import { config } from "../config.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { getItemDirectoryEntries } from "../utilities/get-item-directory-entries.ts";
import { getPersistentDirectoryEntries } from "../utilities/get-persistent-directory-entries.ts";

async function readdir(path: string) {
  if (path === config.rootPath) {
    return PersistentDirectory.options;
  }

  const pathInfo = PathInfo.parse(path);
  const validatePersistentDir = PersistentDirectory.safeParse(pathInfo.name);

  if (validatePersistentDir.success) {
    return getPersistentDirectoryEntries(validatePersistentDir.data);
  }

  if (!pathInfo.tmdbId) {
    return [];
  }

  return getItemDirectoryEntries(pathInfo.type, pathInfo.tmdbId);
}

export const readDirSync = function (path, callback) {
  readdir(path)
    .then((data) => {
      callback(0, data);
    })
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS readdir FuseError: ${error.message}`);

        callback(error.errorCode);

        return;
      }

      logger.error(`VFS readdir unknown error: ${String(error)}`);

      callback(Fuse.ENOENT);
    });
} satisfies OPERATIONS["readdir"];
