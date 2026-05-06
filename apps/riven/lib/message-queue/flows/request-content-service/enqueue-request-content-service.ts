import { flow } from "../producer.ts";
import { createRequestContentServiceJob } from "./request-content-service.schema.ts";

export function enqueueRequestContentService(
  contentServicePlugin: string,
  delay?: number,
) {
  const deduplicationId = `request-content-service-${contentServicePlugin}${delay ? "-refetch" : ""}`;
  const job = createRequestContentServiceJob(
    `Request content: ${contentServicePlugin}`,
    {
      step: "request",
      contentServicePlugin,
    },
    {
      opts: {
        deduplication: {
          id: deduplicationId,
        },
      },
    },
  );

  return flow.add(job);
}
