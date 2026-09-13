import { getActiveSpan } from "@sentry/node";
import { format } from "winston";

import { getLogContext } from "../log-context.ts";

export const sentryMetaFormat = format((info) => {
  const activeSpan = getActiveSpan();

  if (activeSpan) {
    const { spanId, traceId } = activeSpan.spanContext();

    info["trace.id"] = traceId;
    info["span.id"] = spanId;
  }

  try {
    return {
      ...info,
      ...getLogContext(),
    };
  } catch (error) {
    // oxlint-disable-next-line no-console
    console.error(
      `Unexpected error whilst logging "${info.message as string}": ${error instanceof Error ? error.message : String(error)}`,
    );

    throw error;
  }
});
