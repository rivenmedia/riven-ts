import { fromPromise } from "xstate";

import {
  type EnqueueProcessMediaItemInput,
  enqueueProcessMediaItem,
} from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";

export const processMediaItem = fromPromise<
  undefined,
  EnqueueProcessMediaItemInput
>(async ({ input }) => {
  await enqueueProcessMediaItem(input);
});
