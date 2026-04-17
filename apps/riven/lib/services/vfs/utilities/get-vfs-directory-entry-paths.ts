import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { getMoviesDirectoryEntries } from "./get-movies-directory-entries.ts";
import { getShowsDirectoryEntries } from "./get-shows-directory-entries.ts";

export async function getVfsDirectoryEntryPaths(path: string) {
  if (path === "/") {
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
