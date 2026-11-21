import { startSpan } from "@sentry/node";
import { expect, it, vi } from "vitest";

import { withLogContext } from "#utilities/logger/log-context.ts";

import { sentryMetaFormat } from "./sentry-meta.format.ts";

import type { SessionID } from "#utilities/logger/session-id.ts";
import type { TransformableInfo } from "logform";

const logContextFailure = vi.hoisted(() => ({ error: null as Error | null }));

vi.mock(import("#utilities/logger/log-context.ts"), async (importOriginal) => {
  const original = await importOriginal();

  return {
    ...original,
    getLogContext: () => {
      if (logContextFailure.error) {
        throw logContextFailure.error;
      }

      return original.getLogContext();
    },
  };
});

it("does not throw without an active log context", () => {
  const result = sentryMetaFormat().transform({
    message: "startup log",
  } as TransformableInfo);

  expect(result).toMatchObject({
    message: "startup log",
  });
});

it("adds active log context metadata", () => {
  expect.assertions(1);

  const sessionId = "00000000-0000-4000-8000-000000000000" as SessionID;

  withLogContext(
    {
      "riven.log.source": "test",
      "riven.session.id": sessionId,
    },
    () => {
      const result = sentryMetaFormat().transform({
        message: "contextual log",
      } as TransformableInfo);

      expect(result).toMatchObject({
        message: "contextual log",
        "riven.log.source": "test",
        "riven.session.id": sessionId,
      });
    },
  );
});

it("adds the active trace and span IDs", () => {
  expect.assertions(1);

  startSpan({ name: "test span", forceTransaction: true }, (span) => {
    const { spanId, traceId } = span.spanContext();

    expect(
      sentryMetaFormat().transform({
        message: "traced log",
      } as TransformableInfo),
    ).toMatchObject({
      message: "traced log",
      "trace.id": traceId,
      "span.id": spanId,
    });
  });
});

it("reports and rethrows errors whilst resolving the log context", () => {
  const consoleError = vi.spyOn(console, "error").mockReturnValue();

  logContextFailure.error = new Error("Log context unavailable");

  try {
    expect(() =>
      sentryMetaFormat().transform({
        message: "broken log",
      } as TransformableInfo),
    ).toThrow(logContextFailure.error);
  } finally {
    logContextFailure.error = null;
  }

  expect(consoleError).toHaveBeenCalledExactlyOnceWith(
    'Unexpected error whilst logging "broken log": Log context unavailable',
  );
});
