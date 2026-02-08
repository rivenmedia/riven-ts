import Fuse from "@zkochan/fuse-native";

import { database } from "../../database/database.ts";
import { FuseError } from "../errors/fuse-error.ts";

import type { PathInfo } from "../schemas/path-info.schema.ts";

export const getShowSeasonEntries = async (
  pathInfo: PathInfo,
): Promise<string[]> => {
  if (!pathInfo.tvdbId) {
    throw new FuseError(
      Fuse.EINVAL,
      "TVDB ID is required for show seasons directory",
    );
  }

  const entries = await database.season.find({
    parent: {
      tvdbId: pathInfo.tvdbId,
    },
  });

  return entries.reduce<string[]>((acc, { prettyName }) => {
    if (!prettyName) {
      return acc;
    }

    return [...acc, prettyName];
  }, []);
};
