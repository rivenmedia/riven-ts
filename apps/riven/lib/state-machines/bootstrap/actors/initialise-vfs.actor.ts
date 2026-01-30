import {
  type MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.stream-link-requested.event";

import Fuse from "@zkochan/fuse-native";
import { fromPromise } from "xstate";
import z from "zod";

import { fuseOperations } from "../../../vfs/index.ts";

import type { PluginQueueMap } from "../../../types/plugins.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { Queue } from "bullmq";

export interface InitialiseVfsOutput {
  vfs: Fuse;
}

export interface InitialiseVfsInput {
  mountPath: string;
  pluginQueues: PluginQueueMap;
}

export const initialiseVfs = fromPromise<
  InitialiseVfsOutput,
  InitialiseVfsInput
>(async ({ input: { mountPath, pluginQueues } }) => {
  try {
    await new Promise((resolve, reject) => {
      Fuse.configure((error) => {
        if (error) {
          reject(error);
        }

        resolve(undefined);
      });
    });
  } catch (error: unknown) {
    throw new Error(
      `FUSE configuration failed on this system: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const linkRequestQueues = new Map<
    string,
    Queue<
      ParamsFor<MediaItemStreamLinkRequestedEvent>,
      MediaItemStreamLinkRequestedResponse
    >
  >();

  for (const [pluginSymbol, queueMap] of pluginQueues.entries()) {
    for (const [event, queue] of queueMap.entries()) {
      if (
        event !== "riven.media-item.stream-link.requested" ||
        !pluginSymbol.description
      ) {
        continue;
      }

      linkRequestQueues.set(pluginSymbol.description, queue as never);
    }
  }

  const vfs = new Fuse(mountPath, fuseOperations({ linkRequestQueues }), {
    debug: z.stringbool().parse(process.env["VFS_DEBUG_LOGGING"]),
    allowOther: true,
    autoCache: true,
    force: true,
    mkdir: true,
    fsname: "riven_vfs",
  });

  return new Promise((resolve, reject) => {
    vfs.mount((err) => {
      if (err) {
        reject(err);
      }

      resolve({
        vfs,
      });
    });
  });
});
