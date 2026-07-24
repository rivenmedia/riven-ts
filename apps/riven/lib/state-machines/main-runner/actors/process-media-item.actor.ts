import { fromPromise } from "xstate";

import { enqueueProcessMediaItem } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";

import type { EnqueueProcessMediaItemInput } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";

export const processMediaItem = fromPromise<
  undefined,
  EnqueueProcessMediaItemInput
>(async ({ input }) => {
  await enqueueProcessMediaItem(input);
});
