import {
  type MediaItemStreamLinkRequestedEvent,
  MediaItemStreamLinkRequestedResponse,
} from "@rivenmedia/plugin-sdk/schemas/events/media-item.stream-link-requested.event";

import Fuse from "@zkochan/fuse-native";
import dedent from "dedent";
import { stat } from "node:fs/promises";
import { fromPromise } from "xstate";

import { settings } from "../../../utilities/settings.ts";
import { fuseOperations } from "../../../vfs/index.ts";

import type { PluginQueueMap } from "../../../types/plugins.ts";
import type { ParamsFor } from "@rivenmedia/plugin-sdk";
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
  const processUid = process.getuid?.() ?? null;
  const processGid = process.getgid?.() ?? null;

  if (processUid === null || processGid === null) {
    throw new Error(
      dedent`
        Unable to determine process UID or GID.
        This is likely because the process is not running on a Unix-like system, which is not supported.
        VFS cannot be initialised without this information.
      `,
    );
  }

  try {
    const mountPathStats = await stat(mountPath);

    if (!mountPathStats.isDirectory()) {
      throw new Error(
        `VFS mount path "${mountPath}" exists, but is not a directory.`,
      );
    }

    if (mountPathStats.uid !== processUid) {
      throw new Error(
        dedent`
          VFS mount path "${mountPath}" is not owned by the current user.

          Please change the ownership of this directory to the current user by running the following command:

          \`sudo chown ${processUid.toString()} ${mountPath}\`.
        `,
      );
    }
  } catch (error) {
    if (error instanceof Error && "code" in error) {
      switch (error.code) {
        case "ENOTCONN": {
          if (!settings.vfsForceMount) {
            throw new Error(
              dedent`
                The VFS mount path "${mountPath}" is not accessible. This typically occurs when the mount has become stale due to an unclean shutdown or crash.

                To resolve this issue, try unmounting the VFS mount point by running one of the following commands in your terminal, and then restarting Riven:

                sudo umount -l ${mountPath}
                sudo fusermount -uz ${mountPath}
                sudo fusermount3 -uz ${mountPath}
              `,
            );
          }

          break;
        }
        case "ENOENT":
          throw new Error(
            `VFS mount path "${mountPath}" does not exist. Please create this directory.`,
          );
        default:
          throw error;
      }
    } else {
      throw error;
    }
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
    debug: settings.vfsDebugLogging,
    allowOther: true,
    defaultPermissions: true as never,
    entryTimeout: 0,
    attrTimeout: 0,
    acAttrTimeout: 0,
    force: settings.vfsForceMount,
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
