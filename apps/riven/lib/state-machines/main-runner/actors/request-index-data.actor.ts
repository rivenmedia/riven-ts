import { fromPromise } from "xstate";

import {
  type EnqueueIndexItemInput,
  enqueueIndexItem,
} from "../../../message-queue/flows/index-item/enqueue-index-item.ts";

export const requestIndexData = fromPromise<undefined, EnqueueIndexItemInput>(
  async ({ input }) => {
    await enqueueIndexItem(input);
  },
);
