import { fromPromise } from "xstate";

import { VfsMountService } from "../../../vfs/vfs.module.ts";

import type { INestApplicationContext } from "@nestjs/common";
import type Fuse from "@zkochan/fuse-native";

export interface InitialiseVfsOutput {
  vfs: Fuse;
}

export interface InitialiseVfsInput {
  applicationContext: INestApplicationContext;
  mountPath: string;
}

export const initialiseVfs = fromPromise<
  InitialiseVfsOutput,
  InitialiseVfsInput
>(async ({ input: { applicationContext, mountPath } }) => {
  const vfsMountService = applicationContext.get(VfsMountService);

  return {
    vfs: await vfsMountService.mount(mountPath),
  };
});
