import { PathInfo } from "../schemas/path-info.schema.ts";
import { PersistentDirectory } from "../schemas/persistent-directory.schema.ts";
import { getMoviesDirectoryEntries } from "./get-movies-directory-entries.ts";
import { getShowsDirectoryEntries } from "./get-shows-directory-entries.ts";

import type { EntityManager } from "@mikro-orm/core";

export async function getVfsDirectoryEntryPaths(
  em: EntityManager,
  path: string,
) {
  if (path === "/") {
    return PersistentDirectory.options;
  }

  const pathInfo = PathInfo.parse(path);

  switch (pathInfo.pathType) {
    case "all-movies":
    case "single-movie":
      return getMoviesDirectoryEntries(em, pathInfo);
    case "all-shows":
    case "show-seasons":
    case "season-episodes":
      return getShowsDirectoryEntries(em, pathInfo);
    case "single-episode":
      return [pathInfo.base];
  }
}
