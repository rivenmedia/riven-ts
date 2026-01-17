import { fromPromise } from "xstate";

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
    debug: true,
    autoUnmount: true,
    allowOther: true,
    force: true,
    mkdir: true,
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
