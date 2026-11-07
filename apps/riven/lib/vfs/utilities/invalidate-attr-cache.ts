import path from "node:path";

import { attrCache } from "./attr-cache.ts";

/**
 * Removes the cached attributes of the given VFS paths and everything beneath them.
 *
 * @param paths Paths relative to the VFS root, e.g. "movies/Inception (2010) {tmdb-27205}"
 */
export const invalidateAttrCache = (paths: string[]) => {
  const prefixes = paths.map((vfsPath) => path.posix.join("/", vfsPath));

  const staleKeys = [...attrCache.keys()].filter((key) => {
    const keyString = key.toString();

    return prefixes.some(
      (prefix) => keyString === prefix || keyString.startsWith(`${prefix}/`),
    );
  });

  for (const key of staleKeys) {
    attrCache.delete(key);
  }
};
