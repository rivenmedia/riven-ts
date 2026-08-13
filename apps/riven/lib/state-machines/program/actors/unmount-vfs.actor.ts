import { fromPromise } from "xstate";

import { VfsMountService } from "../../../vfs/vfs.module.ts";

import type { INestApplicationContext } from "@nestjs/common";
import type Fuse from "@zkochan/fuse-native";

export interface UnmountVfsInput {
  applicationContext: INestApplicationContext | undefined;
  vfs: Fuse | undefined;
}

export const unmountVfs = fromPromise<undefined, UnmountVfsInput>(
  async ({ input: { applicationContext, vfs } }) => {
    if (!applicationContext) {
      return;
    }

    await applicationContext.get(VfsMountService).unmount(vfs);
  },
);
