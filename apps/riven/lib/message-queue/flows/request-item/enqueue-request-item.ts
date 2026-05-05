import { flow } from "../producer.ts";
import { createRequestItemJob } from "./request-item.schema.ts";

export function enqueueRequestItem() {
  const job = createRequestItemJob("Request item", {
    opts: {
      deduplication: {
        id: "request-item",
      },
    },
  });

  return flow.add(job);
}
