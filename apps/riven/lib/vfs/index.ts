import Fuse from "fuse-native";

import "../types/fuse-native.d.ts";
import { getattrSync } from "./operations/getattr.ts";
import { readDirSync } from "./operations/readdir.ts";

export const ops: Fuse.Operations = {
  readdir: readDirSync,
  getattr: getattrSync,
};

export { Fuse };
