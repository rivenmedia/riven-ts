import Fuse from "fuse-native";

import { getattrSync } from "./operations/getattr.ts";
import { readDirSync } from "./operations/readdir.ts";

export const fuseOperations: Fuse.Operations = {
  readdir: readDirSync,
  getattr: getattrSync,
};
