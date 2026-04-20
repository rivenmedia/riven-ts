import { fromPromise } from "xstate";

import {
  type EnqueueProcessItemInput,
  enqueueProcessItem,
} from "../../../message-queue/flows/process-item/enqueue-process-item.ts";

export const processItem = fromPromise<undefined, EnqueueProcessItemInput>(
  async ({ input }) => {
    await enqueueProcessItem(input);
  },
);
