import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { FileSystemEntry } from "@repo/util-plugin-sdk/dto/entities/index";

import Fuse from "fuse-native";

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
    mtime: st.mtime,
    atime: st.atime,
    ctime: st.ctime,
    size: st.size,
    mode: parseMode(st.mode),
    ...(gid !== undefined ? { gid } : {}),
    ...(uid !== undefined ? { uid } : {}),
  };
};

export const getattrSync = function (path, callback) {
  if (path === "/") {
    callback(0, {
      mtime: new Date(),
      atime: new Date(),
      ctime: new Date(),
      size: 100,
      mode: 16877,
      gid: process.getgid?.() ?? 0,
      uid: process.getuid?.() ?? 0,
    });

    return;
  }

  if (path === "/movies" || path === "/shows") {
    callback(0, {
      mtime: new Date(),
      atime: new Date(),
      ctime: new Date(),
      size: 100,
      mode: 16877,
      gid: process.getgid?.() ?? 0,
      uid: process.getuid?.() ?? 0,
    });

    return;
  }

  async function getattr() {
    const entry = await database.manager.findOneBy(FileSystemEntry, {
      id: 1,
    });

    if (!entry) {
      callback(Fuse.ENOENT);

      return;
    }

    callback(
      0,
      stat({
        ctime: entry.createdAt.getMilliseconds(),
        atime: entry.updatedAt.getMilliseconds(),
        mtime: entry.updatedAt.getMilliseconds(),
        size: Number(entry.fileSize),
        ino: entry.id,
        mode: "file",
      }),
    );
  }

  getattr().catch((error: unknown) => {
    logger.error(`VFS getattr error: ${(error as Error).message}`);

    callback(Fuse.ENOENT);
  });

  return;
} satisfies Fuse.Operations["getattr"];
