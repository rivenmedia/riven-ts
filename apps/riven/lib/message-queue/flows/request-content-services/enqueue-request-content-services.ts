import { flow } from "../producer.ts";
import { createRequestContentServicesJob } from "./request-content-services.schema.ts";

export function enqueueRequestContentServices() {
  const job = createRequestContentServicesJob(
    "Request content services",
    { step: "request" },
    {
      opts: {
        deduplication: {
          id: "request-content-services",
        },
      },
    },
  );

  return flow.add(job);
}
