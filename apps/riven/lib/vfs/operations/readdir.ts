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
  if (path === ROOT_PATH) {
    callback(0, persistentDirs.options);

    return;
  }

  async function readdir() {
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
        callback(
          0,
          entries.reduce<string[]>((acc, entry) => {
            if (!entry.mediaItem.title) {
              return acc;
            }

            return [...acc, entry.mediaItem.path];
          }, []),
        );

        return;
      }
    }

    if (!pathInfo.tmdbId) {
      callback(0, []);

      return;
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
      callback(
        0,
        entries.map((entry) => entry.path),
      );

      return;
    }

    callback(Fuse.ENOENT);
  }

  readdir().catch((error: unknown) => {
    logger.error(`VFS readdir error: ${(error as Error).message}`);
  });
} satisfies Fuse.Operations["readdir"];
