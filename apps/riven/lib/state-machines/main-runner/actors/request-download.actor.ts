import { fromPromise } from "xstate";

import {
  type EnqueueDownloadItemInput,
  enqueueDownloadItem,
} from "../../../message-queue/flows/download-item/enqueue-download-item.ts";

export const requestDownload = fromPromise<undefined, EnqueueDownloadItemInput>(
  async ({ input }) => {
    await enqueueDownloadItem(input);
  },
);
