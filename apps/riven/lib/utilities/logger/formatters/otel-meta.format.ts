import * as Sentry from "@sentry/node";
import { format } from "winston";

export const otelMetaFormat = format((info) => {
  const activeSpan = Sentry.getActiveSpan();

  if (activeSpan) {
    const { spanId, traceId } = activeSpan.spanContext();

    info["trace.id"] = traceId;
    info["span.id"] = spanId;
  }

  return info;
});
