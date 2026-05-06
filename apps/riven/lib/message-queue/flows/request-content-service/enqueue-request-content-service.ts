import { flow } from "../producer.ts";
import { createRequestContentServiceJob } from "./request-content-service.schema.ts";

export function enqueueRequestContentService(
  contentServicePlugin: string,
  delay?: number,
) {
  const job = createRequestContentServiceJob(
    `Request content: ${contentServicePlugin}`,
    {
      step: "request",
      contentServicePlugin,
    },
    {
      opts: {
        ...(delay && { delay }),
        deduplication: {
          id: `request-content-service-${contentServicePlugin}`,
        },
      },
    },
  );

  return flow.add(job);
}
