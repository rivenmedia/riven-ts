import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import Fuse from "@zkochan/fuse-native";

import { FuseError } from "../../../vfs/errors/fuse-error.ts";

import type { PathInfo } from "../schemas/path-info.schema.ts";
import type { EntityManager } from "@mikro-orm/core";

export const getSingleMovieDirectoryEntries = async (
  em: EntityManager,
  pathInfo: PathInfo,
): Promise<string[]> => {
  if (!pathInfo.tmdbId) {
    throw new FuseError(
      Fuse.EINVAL,
      "TMDB ID is required for single movie directory",
    );
  }

  const entry = await em.findOneOrFail(
    Movie,
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

  return [await mediaEntry.getVfsFileName()];
};
