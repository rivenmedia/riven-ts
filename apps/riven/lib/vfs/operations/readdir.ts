import Fuse, { type OPERATIONS } from "@zkochan/fuse-native";

import { logger } from "../../utilities/logger/logger.ts";
import { config } from "../config.ts";
import { isFuseError } from "../errors/fuse-error.ts";
import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { getMoviesDirectoryEntries } from "../utilities/get-movies-directory-entries.ts";
import { getSeasonEpisodeEntries } from "../utilities/get-season-episode-entries.ts";
import { getShowSeasonEntries } from "../utilities/get-show-season-entries.ts";
import { getShowsDirectoryEntries } from "../utilities/get-shows-directory-entries.ts";
import { getSingleMovieDirectoryEntries } from "../utilities/get-single-movie-directory-entries.ts";

async function readdir(path: string) {
  if (path === config.rootPath) {
    return PersistentDirectory.options;
  }

  const pathInfo = PathInfo.parse(path);

  switch (pathInfo.pathType) {
    case "all-movies":
      return getMoviesDirectoryEntries();
    case "all-shows":
      return getShowsDirectoryEntries();
    case "show-seasons":
      return getShowSeasonEntries(pathInfo);
    case "season-episodes":
      return getSeasonEpisodeEntries(pathInfo);
    case "single-movie":
      return getSingleMovieDirectoryEntries(pathInfo);
    case "single-episode":
      return [pathInfo.base];
  }
}

export const readDirSync = function (path, callback) {
  readdir(path)
    .then((data) => {
      process.nextTick(callback, 0, data);
    })
    .catch((error: unknown) => {
      if (isFuseError(error)) {
        logger.error(`VFS readdir FuseError: ${error.message}`);

        process.nextTick(callback, error.errorCode);

        return;
      }

      logger.error(`VFS readdir unknown error: ${String(error)}`);

      process.nextTick(callback, Fuse.ENOENT);
    });
} satisfies OPERATIONS["readdir"];
