import "./utilities/requests/request-agent.ts";

import { Queue } from "bullmq";

import { getattrSync } from "./operations/getattr.ts";
import { openSync } from "./operations/open.ts";
import { readSync } from "./operations/read.ts";
import { readDirSync } from "./operations/readdir.ts";
import { releaseSync } from "./operations/release.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { OPERATIONS } from "@zkochan/fuse-native";

export const fuseOperations: (
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>,
) => OPERATIONS = (pluginQueues) => ({
  getattr: getattrSync,
  open: (path, flags, callback) => {
    openSync(path, flags, pluginQueues, callback);
  },
  read: readSync,
  readdir: readDirSync,
  release: releaseSync,
});
