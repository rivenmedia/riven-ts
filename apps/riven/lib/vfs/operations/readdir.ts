import { logger } from "@repo/core-util-logger";

import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";

import { ROOT_PATH } from "../config.ts";
import { PathInfo } from "../schemas/path-info.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.ts";
import { getItemDirectoryEntries } from "../utilities/get-item-directory-entries.ts";
import { getPersistentDirectoryEntries } from "../utilities/get-persistent-directory-entries.ts";

async function readdir(path: string) {
  if (path === ROOT_PATH) {
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
      logger.error(`VFS readdir error: ${(error as Error).message}`);

      callback(Fuse.ENOENT);
    });
} satisfies OPERATIONS["readdir"];
