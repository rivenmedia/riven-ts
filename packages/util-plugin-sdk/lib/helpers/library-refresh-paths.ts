import path from "node:path";

import type { FileSystemEntry } from "../dto/entities/index.ts";

/**
 * The directories a media server should refresh after a download.
 *
 * Library sections mean one item is visible at several paths at once, so a
 * media server must refresh all of them or its section libraries go stale. The
 * core supplies those directories on the download-success event; events queued
 * before sections existed carry none, and fall back to the entry's own base
 * directory, which reproduces the original behaviour.
 */
export function buildLibraryRefreshPaths(
  entries: readonly FileSystemEntry[],
  libraryDirectories: readonly string[] | undefined,
): string[] {
  const paths = new Set<string>();

  for (const entry of entries) {
    const relativeDirectory = path.dirname(entry.path);
    const roots = libraryDirectories?.length
      ? libraryDirectories
      : [entry.baseDirectory];

    for (const root of roots) {
      paths.add(path.join(root, relativeDirectory));
    }
  }

  return [...paths];
}
