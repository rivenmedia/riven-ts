import { fromPromise } from "xstate";
import z from "zod";

import { Fuse, ops } from "../../../vfs/index.ts";

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
  const vfs = new Fuse(mountPath, ops, {
    debug: z.stringbool().parse(process.env["VFS_DEBUG_LOGGING"]),
    autoUnmount: true,
    allowOther: true,
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
