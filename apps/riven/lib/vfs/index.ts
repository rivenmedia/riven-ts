import Fuse from "fuse-native";

import "../types/fuse-native.d.ts";
import { getattrSync } from "./operations/getattr.ts";
import { openSync } from "./operations/open.ts";
import { readSync } from "./operations/read.ts";
import { readDirSync } from "./operations/readdir.ts";
import { releaseSync } from "./operations/release.ts";

export const ops: Fuse.Operations = {
  readdir: readDirSync,
  getattr: getattrSync,
  open: openSync,
  release: releaseSync,
  read: readSync,
};

export { Fuse };
