import Fuse from "@zkochan/fuse-native";

import { database } from "../../database/database.ts";
import { FuseError } from "../errors/fuse-error.ts";

import type { PathInfo } from "../schemas/path-info.schema.ts";

export const getSingleMovieDirectoryEntries = async (
  pathInfo: PathInfo,
): Promise<string[]> => {
  if (!pathInfo.tmdbId) {
    throw new FuseError(
      Fuse.EINVAL,
      "TMDB ID is required for single movie directory",
    );
  }

  const entry = await database.movie.findOneOrFail(
    { tmdbId: pathInfo.tmdbId },
    { populate: ["filesystemEntries"] },
  );

  const [mediaEntry] = await entry.getMediaEntries();

  if (!mediaEntry) {
    throw new FuseError(
      Fuse.ENOENT,
      `No filesystem entries found for movie with TMDB ID ${pathInfo.tmdbId}`,
    );
  }

  return [mediaEntry.vfsFileName];
};
