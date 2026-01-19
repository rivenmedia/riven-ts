import Fuse from "fuse-native";
import { fromPromise } from "xstate";
import z from "zod";

import { fuseOperations } from "../../../vfs/index.ts";

export interface InitialiseVfsOutput {
  vfs: Fuse;
}

export interface InitialiseVfsInput {
  mountPath: string;
}

export const initialiseVfs = fromPromise<
  InitialiseVfsOutput,
  InitialiseVfsInput
>(async ({ input: { mountPath } }) => {
  const isConfigured = await new Promise<boolean | undefined>(
    (resolve, reject) => {
      Fuse.isConfigured((err, val) => {
        if (err) {
          console.error(err);
          reject(err);
        }

        resolve(val);
      });
    },
  );

  if (!isConfigured) {
    throw new Error(
      "FUSE is not configured on this system. Please run `cd apps/riven && sudo env PATH=$PATH npm run fuse:configure`.",
    );
  }

  const vfs = new Fuse(mountPath, fuseOperations, {
    debug: z.stringbool().parse(process.env["VFS_DEBUG_LOGGING"]),
    autoUnmount: true,
    // allowOther: true,
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
