import { fromPromise } from "xstate";

import {
  type EnqueueRequestContentServicesInput,
  enqueueRequestContentServices,
} from "../../../message-queue/flows/request-content-services/enqueue-request-content-services.ts";

export const requestContentServices = fromPromise<
  undefined,
  EnqueueRequestContentServicesInput
>(async ({ input }) => {
  await enqueueRequestContentServices(input);
});
