import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import Fuse from "fuse-native";

import { ROOT_PATH, persistentDirs } from "../config.ts";

export const readDirSync = function (path, callback) {
  async function readdir() {
    const entries = await database.manager.find(MediaEntry, {
      where: {
        mediaItem: {
          id: 1,
        },
      },
      relations: {
        mediaItem: true,
      },
    });

    if (path === ROOT_PATH) {
      callback(0, persistentDirs);

      return;
    }

    if (entries.length) {
      callback(
        0,
        entries.map((entry) => entry.originalFilename),
      );

      return;
    }

    callback(Fuse.ENOENT);
  }

  readdir().catch((error: unknown) => {
    logger.error(`VFS readdir error: ${(error as Error).message}`);
  });
} satisfies Fuse.Operations["readdir"];
