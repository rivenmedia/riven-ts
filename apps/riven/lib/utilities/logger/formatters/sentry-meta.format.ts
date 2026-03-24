import * as Sentry from "@sentry/node";
import { format } from "winston";

export const sentryMetaFormat = format((info) => {
  const activeSpan = Sentry.getActiveSpan();
  const scopeData = Sentry.getCurrentScope().getScopeData();

  if (activeSpan) {
    const { spanId, traceId } = activeSpan.spanContext();

    info["trace.id"] = traceId;
    info["span.id"] = spanId;
  }

  return {
    ...info,
    ...scopeData.tags,
  };
});
