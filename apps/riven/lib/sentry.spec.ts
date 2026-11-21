import { Writable } from "node:stream";
import { expect, it as baseIt, vi } from "vitest";
import { transports } from "winston";

import type * as SentryModule from "@sentry/node";
import type { NodeOptions } from "@sentry/node";

const sentry = vi.hoisted(() => ({
  init: vi.fn<(options: NodeOptions) => void>(),
  logger: {
    trace: vi.fn<(message: string, attributes: unknown) => void>(),
    debug: vi.fn<(message: string, attributes: unknown) => void>(),
    info: vi.fn<(message: string, attributes: unknown) => void>(),
    warn: vi.fn<(message: string, attributes: unknown) => void>(),
    error: vi.fn<(message: string, attributes: unknown) => void>(),
    fatal: vi.fn<(message: string, attributes: unknown) => void>(),
  },
}));

vi.mock(
  import("@sentry/node"),
  async (importOriginal) =>
    ({
      ...(await importOriginal()),
      init: sentry.init,
      logger: sentry.logger,
    }) as unknown as typeof SentryModule,
);

type Transaction = Parameters<
  NonNullable<NodeOptions["beforeSendTransaction"]>
>[0];

const it = baseIt.extend(
  "importSentry",
  () => async (env: Record<string, string>) => {
    vi.resetModules();

    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value);
    }

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null));

    await import("./sentry.ts");

    const { logger } = await import("./utilities/logger/logger.ts");

    return { fetchSpy, logger };
  },
);

const getBeforeSendTransaction = () => {
  const [options] = sentry.init.mock.calls[0] ?? [];
  const beforeSendTransaction = options?.beforeSendTransaction;

  expect.assert(beforeSendTransaction);

  return (event: Transaction) => {
    const result = beforeSendTransaction(event, {});

    // Riven's hook is synchronous, so it never returns a promise
    expect.assert(result === null || !("then" in result));

    return result;
  };
};

it("does not initialise Sentry unless Spotlight is enabled", async ({
  importSentry,
}) => {
  const { fetchSpy } = await importSentry({ SENTRY_SPOTLIGHT: "0" });

  expect(sentry.init).not.toHaveBeenCalled();
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("initialises Sentry against the local Spotlight server", async ({
  importSentry,
}) => {
  const { fetchSpy } = await importSentry({
    SENTRY_SPOTLIGHT: "1",
    SENTRY_SPOTLIGHT_CLEAR_ON_STARTUP: "0",
  });

  expect(sentry.init).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      dsn: "https://spotlight@127.0.0.1/0",
      enableLogs: true,
      sampleRate: 1,
      tracesSampleRate: 1,
    }),
  );
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("clears the Spotlight server on startup when configured", async ({
  importSentry,
}) => {
  const { fetchSpy } = await importSentry({
    SENTRY_SPOTLIGHT: "1",
    SENTRY_SPOTLIGHT_CLEAR_ON_STARTUP: "1",
  });

  expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
    "http://localhost:8969/clear",
    { method: "DELETE" },
  );
});

it.for(["extendLocks", "moveStalledJobsToWait"])(
  "drops BullMQ %s housekeeping transactions",
  async (operation, { importSentry }) => {
    await importSentry({ SENTRY_SPOTLIGHT: "1" });

    const beforeSendTransaction = getBeforeSendTransaction();

    expect(
      beforeSendTransaction({
        type: "transaction",
        contexts: {
          trace: {
            trace_id: "trace",
            span_id: "span",
            data: { "bullmq.queue.operation": operation },
          },
        },
      }),
    ).toBeNull();
  },
);

it("marks a transaction as failed when one of its BullMQ spans failed", async ({
  importSentry,
}) => {
  await importSentry({ SENTRY_SPOTLIGHT: "1" });

  const beforeSendTransaction = getBeforeSendTransaction();

  const event = beforeSendTransaction({
    type: "transaction",
    contexts: {
      trace: {
        trace_id: "trace",
        span_id: "span",
        data: { "bullmq.queue.operation": "process" },
      },
    },
    spans: [
      {
        span_id: "ok",
        trace_id: "trace",
        start_timestamp: 0,
        data: { "bullmq.queue.operation": "complete" },
      },
      {
        span_id: "failed",
        trace_id: "trace",
        start_timestamp: 0,
        data: { "bullmq.queue.operation": "fail" },
      },
    ],
  });

  expect(event?.contexts?.trace?.status).toBe("error");
  expect(event?.spans?.map(({ status }) => status)).toStrictEqual([
    undefined,
    "error",
  ]);
});

it("keeps successful transactions unchanged", async ({ importSentry }) => {
  await importSentry({ SENTRY_SPOTLIGHT: "1" });

  const beforeSendTransaction = getBeforeSendTransaction();

  const event = beforeSendTransaction({
    type: "transaction",
    contexts: {
      trace: { trace_id: "trace", span_id: "span" },
    },
    spans: [
      {
        span_id: "ok",
        trace_id: "trace",
        start_timestamp: 0,
        data: { "bullmq.queue.operation": "complete" },
      },
    ],
  });

  expect(event?.contexts?.trace?.status).toBeUndefined();
  expect(event?.spans?.[0]?.status).toBeUndefined();
});

it("forwards log entries to the Sentry logger at the matching level", async ({
  importSentry,
}) => {
  expect.hasAssertions();

  const { logger } = await importSentry({ SENTRY_SPOTLIGHT: "1" });

  // Logging is disabled in tests, so enable it with a transport that discards the output
  logger.configure({
    level: "silly",
    silent: false,
    transports: [
      new transports.Stream({
        stream: new Writable({
          objectMode: true,
          write(_chunk, _encoding, callback) {
            callback();
          },
        }),
      }),
    ],
  });

  logger.warn("Something looks wrong", { "riven.test": "warn" });
  logger.verbose("Verbose detail", { "riven.test": "verbose" });

  await vi.waitFor(() => {
    expect(sentry.logger.warn).toHaveBeenCalledWith(
      "Something looks wrong",
      expect.objectContaining({ "riven.test": "warn" }),
    );
    // Winston levels without a Sentry equivalent are logged as traces
    expect(sentry.logger.trace).toHaveBeenCalledWith(
      "Verbose detail",
      expect.objectContaining({ "riven.test": "verbose" }),
    );
  });
});
