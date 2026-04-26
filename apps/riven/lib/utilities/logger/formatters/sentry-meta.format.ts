import * as Sentry from "@sentry/node";
import { format } from "winston";

import { getLogContext } from "../log-context.ts";

export const sentryMetaFormat = format((info) => {
  const activeSpan = Sentry.getActiveSpan();

  if (activeSpan) {
    const { spanId, traceId } = activeSpan.spanContext();

    info["trace.id"] = traceId;
    info["span.id"] = spanId;
  }

  return {
    ...info,
    ...getLogContext(),
  };
});
