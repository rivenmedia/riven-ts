import fs from "node:fs";

import type { Stats } from "@zkochan/fuse-native";
import type { SetOptional } from "type-fest";

export type StatMode = "dir" | "file" | "link" | number;

function parseMode(mode: StatMode): number {
  if (typeof mode === "number") {
    return mode;
  }

  switch (mode) {
    case "dir":
      return fs.constants.S_IFDIR | 0o755;
    case "file":
      return fs.constants.S_IFREG | 0o644;
    case "link":
      return fs.constants.S_IFLNK | 0o755;
    default:
      return 0;
  }
}

export type StatInput = SetOptional<
  Omit<
    Stats,
    "mode" | "size" | "blksize" | "dev" | "nlink" | "rdev" | "ino" | "blocks"
  >,
  "gid" | "uid"
> & {
  mode: StatMode;
} & (
    | {
        mode: Extract<StatMode, "dir">;
        size?: never;
      }
    | {
        mode: Exclude<StatMode, "dir">;
        size: number;
      }
  );

export const stat = (st: StatInput, subDirectoryCount = 0) => {
  const gid = st.gid ?? process.getgid?.() ?? 0;
  const uid = st.uid ?? process.getuid?.() ?? 0;
  const nlink = st.mode === "dir" ? 2 + subDirectoryCount : 1;

  return {
    ...st,
    gid,
    uid,
    mode: parseMode(st.mode),
    size: st.mode === "dir" ? 0 : st.size,
    nlink,
  } satisfies Partial<Stats>;
};
