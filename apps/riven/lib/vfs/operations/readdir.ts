import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import Fuse from "fuse-native";

import {
  ROOT_PATH,
  childQueryType,
  pathSchema,
  persistentDirs,
} from "../config.ts";

export const readDirSync = function (path, callback) {
  async function readdir() {
    if (path === ROOT_PATH) {
      return persistentDirs.options;
    }

    const pathInfo = pathSchema.parse(path);
    const validatePersistentDir = persistentDirs.safeParse(pathInfo.name);

    if (validatePersistentDir.success) {
      const entries = await database.manager.find(MediaEntry, {
        select: {
          mediaItem: {
            tmdbId: true,
            year: true,
            title: true,
          },
        },
        where: {
          mediaItem: {
            type: childQueryType[validatePersistentDir.data],
          },
        },
        relations: {
          mediaItem: true,
        },
      });

      if (entries.length) {
        return entries.reduce<string[]>((acc, entry) => {
          if (!entry.mediaItem.title) {
            return acc;
          }

          return [...acc, entry.mediaItem.path];
        }, []);
      }
    }

    if (!pathInfo.tmdbId) {
      return [];
    }

    const entries = await database.manager.find(MediaEntry, {
      select: {
        originalFilename: true,
        mediaItem: {
          tmdbId: true,
          year: true,
          title: true,
        },
      },
      where: {
        mediaItem: {
          type: childQueryType[pathInfo.type],
          tmdbId: pathInfo.tmdbId,
        },
      },
      relations: {
        mediaItem: true,
      },
    });

    if (entries.length) {
      return entries.map((entry) => entry.path);
    }

    throw new Error("No entries found");
  }

  readdir()
    .then((data) => {
      callback(0, data);
    })
    .catch((error: unknown) => {
      logger.error(`VFS readdir error: ${(error as Error).message}`);

      callback(Fuse.ENOENT);
    });
} satisfies Fuse.Operations["readdir"];
