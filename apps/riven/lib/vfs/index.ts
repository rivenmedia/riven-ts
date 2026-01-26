import "./utilities/requests/request-agent.ts";

import { getattrSync } from "./operations/getattr.ts";
import { openSync } from "./operations/open.ts";
import { readSync } from "./operations/read.ts";
import { readDirSync } from "./operations/readdir.ts";
import { releaseSync } from "./operations/release.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type {
  MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";
import type { OPERATIONS } from "@zkochan/fuse-native";
import type { Queue } from "bullmq";

interface FuseOperationsInput {
  linkRequestQueues: Map<
    string,
    Queue<
      ParamsFor<MediaItemStreamLinkRequestedEvent>,
      MediaItemStreamLinkRequestedResponse
    >
  >;
}

export const fuseOperations = ({ linkRequestQueues }: FuseOperationsInput) =>
  ({
    getattr: getattrSync,
    open: (path, flags, callback) => {
      openSync(path, flags, linkRequestQueues, callback);
    },
    read: readSync,
    readdir: readDirSync,
    release: releaseSync,
  }) satisfies OPERATIONS;
