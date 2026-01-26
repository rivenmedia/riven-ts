import "./utilities/requests/request-agent.ts";

import { getattrSync } from "./operations/getattr.ts";
import { openSync } from "./operations/open.ts";
import { readSync } from "./operations/read.ts";
import { readDirSync } from "./operations/readdir.ts";
import { releaseSync } from "./operations/release.ts";

import type { OPERATIONS } from "@zkochan/fuse-native";

export const fuseOperations: OPERATIONS = {
  getattr: getattrSync,
  open: openSync,
  read: readSync,
  readdir: readDirSync,
  release: releaseSync,
};
