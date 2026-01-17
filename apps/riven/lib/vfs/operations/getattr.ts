import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import Fuse from "fuse-native";

import { HIDDEN_PATH, TRASH_PATH, childQueryType } from "../config.ts";
import { pathSchema } from "../schemas/path.ts";

type StatMode = "dir" | "file" | "link" | number;

function parseMode(mode: StatMode): number {
  if (typeof mode === "number") {
    return mode;
  }

  switch (mode) {
    case "dir":
      return 16877;
    case "file":
      return 33188;
    case "link":
      return 41453;
    default:
      return 0;
  }
}

const stat = (st: Omit<Fuse.Stats, "mode"> & { mode: StatMode }) => {
  const gid = st.gid ?? process.getgid?.();
  const uid = st.uid ?? process.getuid?.();

  return {
    ...st,
    mode: parseMode(st.mode),
    ...(gid !== undefined ? { gid } : {}),
    ...(uid !== undefined ? { uid } : {}),
  } satisfies Fuse.Stats;
};

export const getattrSync = function (path, callback) {
  async function getattr() {
    if (
      path.toLowerCase().startsWith(TRASH_PATH) ||
      path.endsWith(HIDDEN_PATH)
    ) {
      return;
    }

    switch (path) {
      case "/":
      case "/movies":
      case "/shows": {
        return stat({
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          size: 0,
          mode: "dir",
        });
      }
    }

    const pathInfo = pathSchema.parse(path);
    const entityType = childQueryType[pathInfo.type];

    const entry = await database.manager.findOneBy(FileSystemEntry, {
      mediaItem: {
        type: entityType,
      },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    return stat({
      ctime: entry.createdAt.getTime(),
      atime: entry.updatedAt.getTime(),
      mtime: entry.updatedAt.getTime(),
      size: pathInfo.isFile ? Number(entry.fileSize) : 0,
      mode: pathInfo.isFile ? "file" : "dir",
    });
  }

  getattr()
    .then((data) => {
      callback(0, data);
    })
    .catch((error: unknown) => {
      logger.error(`VFS getattr error: ${(error as Error).message}`);

      callback(Fuse.ENOENT);
    });
} satisfies Fuse.Operations["getattr"];
