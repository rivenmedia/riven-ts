import { startSpan } from "@sentry/node";
import { expect, it as baseIt, vi } from "vitest";

import {
  getLogContext,
  withLogContext,
} from "#utilities/logger/log-context.ts";

import { sentryMetaFormat } from "./sentry-meta.format.ts";

import type { SessionID } from "#utilities/logger/session-id.ts";
import type { TransformableInfo } from "logform";

vi.mock(import("#utilities/logger/log-context.ts"), { spy: true });

const it = baseIt
  .extend("spyOnConsoleError", () => () => vi.spyOn(console, "error"))
  .extend("failLogContext", ({}, { onCleanup }) => {
    onCleanup(() => {
      vi.mocked(getLogContext).mockReset();
    });

    return (error: Error) => {
      vi.mocked(getLogContext).mockImplementation(() => {
        throw error;
      });
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

it("reports and rethrows errors whilst resolving the log context", ({
  failLogContext,
  spyOnConsoleError,
}) => {
  const consoleError = spyOnConsoleError().mockReturnValue();
  const error = new Error("Log context unavailable");

  failLogContext(error);

  expect(() =>
    sentryMetaFormat().transform({
      message: "broken log",
    } as TransformableInfo),
  ).toThrow(error);

  expect(consoleError).toHaveBeenCalledExactlyOnceWith(
    'Unexpected error whilst logging "broken log": Log context unavailable',
  );
});
