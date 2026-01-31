import { logger } from "@repo/core-util-logger";

import Fuse from "@zkochan/fuse-native";
import { fromPromise } from "xstate";

export const unmountVfs = fromPromise<undefined, Fuse | undefined>(
  async ({ input: vfs }) => {
    if (!vfs) {
      logger.warn("No FUSE VFS instance found to unmount");

      return;
    }

    await new Promise((resolve, reject) => {
      vfs.unmount((error) => {
        if (error) {
          reject(error);

          return;
        }

        resolve(undefined);
      });
    });
  },
);
