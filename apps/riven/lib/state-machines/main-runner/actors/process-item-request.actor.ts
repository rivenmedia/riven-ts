import { fromPromise } from "xstate";

import {
  type ProcessItemRequestInput,
  enqueueProcessItemRequest,
} from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";

export const processItemRequest = fromPromise<
  undefined,
  ProcessItemRequestInput
>(async ({ input }) => {
  await enqueueProcessItemRequest(input);
});
