import { fromPromise } from "xstate";

import { enqueueRequestContentServices } from "../../../message-queue/flows/request-content-services/enqueue-request-content-services.ts";

export const requestContentServices = fromPromise(
  enqueueRequestContentServices,
);
