import Fuse from "@zkochan/fuse-native";

import { database } from "../../database/database.ts";
import { FuseError } from "../errors/fuse-error.ts";

import type { PathInfo } from "../schemas/path-info.schema.ts";

export const getSeasonEpisodeEntries = async (
  pathInfo: PathInfo,
): Promise<string[]> => {
  if (!pathInfo.tvdbId) {
    throw new FuseError(
      Fuse.EINVAL,
      "TVDB ID is required for season episodes directory",
    );
  }

  if (!pathInfo.season) {
    throw new FuseError(
      Fuse.EINVAL,
      "Season number is required for season episodes directory",
    );
  }

  const entries = await database.episode.find(
    {
      season: {
        number: pathInfo.season,
        parent: {
          tvdbId: pathInfo.tvdbId,
        },
      },
    },
    {
      populate: ["$infer", "filesystemEntries"],
    },
  );

  if (!entries[0] || !entries[0].filesystemEntries.length) {
    throw new FuseError(
      Fuse.ENOENT,
      `No episodes found for TVDB ID ${pathInfo.tvdbId} season ${pathInfo.season.toString()}`,
    );
  }

  return entries.reduce<string[]>((acc, { prettyName }) => {
    if (!prettyName) {
      return acc;
    }

    return [...acc, prettyName];
  }, []);
};
