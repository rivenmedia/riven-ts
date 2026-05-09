import { flow } from "../producer.ts";
import { createRequestContentServiceJob } from "./request-content-service.schema.ts";

export function enqueueRequestContentService(
  contentServicePlugin: string,
  delaySeconds?: number,
) {
  const job = createRequestContentServiceJob(
    `Request content: ${contentServicePlugin}`,
    {
      step: "request",
      contentServicePlugin,
    },
    {
      opts: {
        ...(delaySeconds && { delay: delaySeconds * 1000 }),
        deduplication: {
          id: `request-content-service-${contentServicePlugin}`,
        },
      },
    },
  );

  return flow.add(job);
}
