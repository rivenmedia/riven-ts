import Fuse from "@zkochan/fuse-native";
import { Queue } from "bullmq";
import { fromPromise } from "xstate";
import z from "zod";

import { fuseOperations } from "../../../vfs/index.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export interface InitialiseVfsOutput {
  vfs: Fuse;
}

export interface InitialiseVfsInput {
  mountPath: string;
  pluginQueues: Map<symbol, Map<RivenEvent["type"], Queue>>;
}

export const initialiseVfs = fromPromise<
  InitialiseVfsOutput,
  InitialiseVfsInput
>(async ({ input: { mountPath, pluginQueues } }) => {
  const isConfigured = await new Promise<boolean | undefined>(
    (resolve, reject) => {
      Fuse.isConfigured((err, val) => {
        if (err) {
          reject(err);
        }

        resolve(val);
      });
    },
  );

  if (!isConfigured) {
    throw new Error(
      "FUSE is not configured on this system. Please run `sudo env PATH=$PATH npm run --prefix apps/riven fuse:configure`.",
    );
  }

  const vfs = new Fuse(mountPath, fuseOperations(pluginQueues), {
    debug: z.stringbool().parse(process.env["VFS_DEBUG_LOGGING"]),
    autoUnmount: true,
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
