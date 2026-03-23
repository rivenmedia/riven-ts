import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";

import { logger } from "../../utilities/logger/logger.ts";
import { config } from "../config.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { getMoviesDirectoryEntries } from "../utilities/get-movies-directory-entries.ts";
import { getShowsDirectoryEntries } from "../utilities/get-shows-directory-entries.ts";
import { withVfsScope } from "../utilities/with-vfs-scope.ts";

async function readdir(path: string): Promise<string[]> {
  if (path === config.rootPath) {
    return PersistentDirectory.options;
  }

  const pathInfo = PathInfo.parse(path);

  switch (pathInfo.pathType) {
    case "all-movies":
    case "single-movie":
      return getMoviesDirectoryEntries(pathInfo.tmdbId);
    case "all-shows":
    case "show-seasons":
    case "season-episodes":
      return getShowsDirectoryEntries(pathInfo.tvdbId, pathInfo.season);
    case "single-episode":
      return [pathInfo.base];
  }
}

export const readDirSync = function (path, callback) {
  void withVfsScope(async () => {
    try {
      const data = await readdir(path);

      process.nextTick(callback, 0, data);
    } catch (error) {
      if (isFuseError(error)) {
        logger.error("VFS readdir FuseError", { err: error });

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error("Unexpected VFS readdir error", { err: error });

      process.nextTick(callback, Fuse.ENOENT);
    }
  });
} satisfies OPERATIONS["readdir"];
