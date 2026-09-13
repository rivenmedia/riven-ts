import { fromPromise } from "xstate";

import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";

import type { ProcessItemRequestInput } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";

export const processItemRequest = fromPromise<
  undefined,
  ProcessItemRequestInput
>(async ({ input }) => {
  await enqueueProcessItemRequest(input);
});
