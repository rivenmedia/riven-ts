import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import Fuse from "fuse-native";

import { HIDDEN_PATH, TRASH_PATH, childQueryType } from "../config.ts";
import { PathInfo } from "../schemas/path-info.ts";

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

type StatInput = Omit<Fuse.Stats, "mode" | "size"> & { mode: StatMode } & (
    | {
        mode: Extract<StatMode, "dir">;
        size?: never;
      }
    | {
        mode: Exclude<StatMode, "dir">;
        size: number;
      }
  );

const stat = (st: StatInput) => {
  const gid = st.gid ?? process.getgid?.();
  const uid = st.uid ?? process.getuid?.();

  return {
    ...st,
    mode: parseMode(st.mode),
    size: st.mode === "dir" ? 0 : st.size,
    ...(gid !== undefined ? { gid } : {}),
    ...(uid !== undefined ? { uid } : {}),
  } satisfies Fuse.Stats;
};

async function getattr(path: string) {
  if (path.toLowerCase().startsWith(TRASH_PATH) || path.endsWith(HIDDEN_PATH)) {
    return;
  }

  switch (path) {
    case "/":
    case "/movies":
    case "/shows": {
      return stat({
        mtime: new Date().getTime(),
        atime: new Date().getTime(),
        ctime: new Date().getTime(),
        mode: "dir",
      });
    }
  }

  const pathInfo = PathInfo.parse(path);
  const entityType = childQueryType[pathInfo.type];

  if (!pathInfo.tmdbId) {
    throw new Error(`Invalid path: ${path}`);
  }

  const entry = await database.manager.findOneBy(FileSystemEntry, {
    mediaItem: {
      tmdbId: pathInfo.tmdbId,
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
    ...(pathInfo.isFile
      ? {
          size: Number(entry.fileSize),
          mode: "file",
        }
      : {
          mode: "dir",
        }),
  });
}

export const getattrSync = function (path, callback) {
  getattr(path)
    .then((data) => {
      callback(0, data);
    })
    .catch((error: unknown) => {
      logger.error(`VFS getattr error: ${(error as Error).message}`);

      callback(Fuse.ENOENT);
    });
} satisfies Fuse.Operations["getattr"];
