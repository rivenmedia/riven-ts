import { getGlobalDispatcher } from "undici";
import { fromPromise } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

import type Fuse from "@zkochan/fuse-native";

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

    await getGlobalDispatcher().destroy();
  },
);
