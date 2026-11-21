import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { QueueEvents } from "bullmq";
import { HttpResponse, http } from "msw";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";
import { createLogger } from "winston";

import { it as baseIt } from "../__tests__/test-context.ts";
import { BaseDataSource, DataSourceHTTPError } from "./index.ts";

import type { BaseDataSourceConfig } from "./index.ts";
import type { Promisable } from "type-fest";

class TestDataSource extends BaseDataSource<Record<string, unknown>> {
  public override baseURL = "https://example.com/api";

  public override validate(): Promisable<boolean> {
    return true;
  }
}

const it = baseIt
  .extend("keyvCache", async ({ redisClient: { url } }, { onCleanup }) => {
    const { default: KeyvRedis, Keyv } = await import("@keyv/redis");

    const keyv = new Keyv<string>(new KeyvRedis(url.toString()));

    onCleanup(async () => {
      await keyv.disconnect();
    });

    return new KeyvAdapter(keyv as never);
  })
  .extend("dataSourceConfig", ({ redisClient, keyvCache }, { onCleanup }) => {
    const logger = createLogger({ silent: true });

    const config = {
      settings: {},
      connection: redisClient.client,
      cache: keyvCache,
      logger,
      pluginSymbol: Symbol.for(`@repo/plugin-test-${randomUUID()}`),
      telemetry: undefined as never, // Telemetry isn't needed here; force disable
      userAgent: "mock-user-agent",
    } satisfies BaseDataSourceConfig<Record<string, unknown>>;

    onCleanup(async () => {
      await redisClient.client.flushall();
    });

    return config;
  });

it("enqueues subsequent jobs to the same URL separately", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => HttpResponse.json({ success: false }), {
      once: true,
    }),
    http.get("**/endpoint", () => HttpResponse.json({ success: true }), {
      once: true,
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);

  const firstRequest = await dataSource.fetch("endpoint");

  expect(firstRequest.parsedBody).toStrictEqual({ success: false });

  const secondRequest = await dataSource.fetch("endpoint");

  expect(secondRequest.parsedBody).toStrictEqual({ success: true });
});

it("bypasses the queue if a valid response is available in the cache", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get(
      "**/endpoint",
      () =>
        HttpResponse.json(
          { value: "cached-value" },
          { headers: { "Cache-Control": "max-age=3600" } },
        ),
      { once: true },
    ),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const queueAddSpy = vi.spyOn(dataSource.queue, "add");

  await dataSource.fetch("endpoint");
  await dataSource.fetch("endpoint");

  expect(queueAddSpy).toHaveBeenCalledOnce();
});

it("does not bypass the queue if no valid response is available in the cache", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => HttpResponse.json({ value: "value-1" }), {
      once: true,
    }),
    http.get("**/endpoint", () => HttpResponse.json({ value: "value-2" }), {
      once: true,
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const queueAddSpy = vi.spyOn(dataSource.queue, "add");

  await dataSource.fetch("endpoint");
  await dataSource.fetch("endpoint");

  expect(queueAddSpy).toHaveBeenCalledTimes(2);
});

it("returns a cached response if available in the cache", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get(
      "**/endpoint",
      () =>
        HttpResponse.json(
          { value: "cached-value" },
          { headers: { "Cache-Control": "max-age=3600" } },
        ),
      { once: true },
    ),
  );

  const dataSource = new TestDataSource(dataSourceConfig);

  await dataSource.fetch("endpoint");

  const secondRequest = await dataSource.fetch("endpoint");

  expect(secondRequest.parsedBody).toStrictEqual({ value: "cached-value" });
});

it("deduplicates concurrent GET requests to the same URL", async ({
  server,
  dataSourceConfig,
}) => {
  let requestCount = 0;

  server.use(
    http.get("**/endpoint", () => {
      requestCount += 1;

      return HttpResponse.json({ value: requestCount });
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const queueAddSpy = vi.spyOn(dataSource.queue, "add");

  const responses = await Promise.all([
    dataSource.fetch("endpoint"),
    dataSource.fetch("endpoint"),
    dataSource.fetch("endpoint"),
  ]);

  expect(queueAddSpy).toHaveBeenCalledOnce();

  expect(requestCount).toBe(1);

  for (const response of responses) {
    expect(response.parsedBody).toStrictEqual({ value: 1 });
  }
});

it("does not deduplicate concurrent GET requests with different params", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", ({ request }) =>
      HttpResponse.json({
        page: new URL(request.url).searchParams.get("page"),
      }),
    ),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const queueAddSpy = vi.spyOn(dataSource.queue, "add");

  const [firstPage, secondPage] = await Promise.all([
    dataSource.fetch("endpoint", { params: { page: "1" } }),
    dataSource.fetch("endpoint", { params: { page: "2" } }),
  ]);

  expect(queueAddSpy).toHaveBeenCalledTimes(2);

  expect(firstPage.parsedBody).toStrictEqual({ page: "1" });
  expect(secondPage.parsedBody).toStrictEqual({ page: "2" });
});

it("does not deduplicate concurrent POST requests", async ({
  server,
  dataSourceConfig,
}) => {
  let requestCount = 0;

  server.use(
    http.post("**/endpoint", () => {
      requestCount += 1;

      return HttpResponse.json({ success: true });
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const queueAddSpy = vi.spyOn(dataSource.queue, "add");

  await Promise.all([
    dataSource.fetch("endpoint", { method: "POST", body: { value: 1 } }),
    dataSource.fetch("endpoint", { method: "POST", body: { value: 1 } }),
  ]);

  expect(queueAddSpy).toHaveBeenCalledTimes(2);
  expect(requestCount).toBe(2);
});

it("rejects all deduplicated requests when the shared request fails, then allows a retry", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => new HttpResponse(null, { status: 404 }), {
      once: true,
    }),
    http.get("**/endpoint", () => HttpResponse.json({ success: true }), {
      once: true,
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const queueAddSpy = vi.spyOn(dataSource.queue, "add");

  const results = await Promise.allSettled([
    dataSource.fetch("endpoint"),
    dataSource.fetch("endpoint"),
  ]);

  expect(queueAddSpy).toHaveBeenCalledOnce();

  for (const result of results) {
    expect.assert(result.status === "rejected");

    expect(result.reason).toBeInstanceOf(DataSourceHTTPError);
  }

  const retry = await dataSource.fetch("endpoint");

  expect(queueAddSpy).toHaveBeenCalledTimes(2);
  expect(retry.parsedBody).toStrictEqual({ success: true });
});

it("performs a single cache lookup for concurrent GET requests to a cached URL", async ({
  server,
  dataSourceConfig,
  keyvCache,
}) => {
  server.use(
    http.get(
      "**/cached-endpoint",
      () =>
        HttpResponse.json(
          { value: "cached-value" },
          { headers: { "Cache-Control": "max-age=3600" } },
        ),
      { once: true },
    ),
  );

  const dataSource = new TestDataSource(dataSourceConfig);

  // Warm the cache
  await dataSource.fetch("cached-endpoint");

  const queueAddSpy = vi.spyOn(dataSource.queue, "add");
  const cacheGetSpy = vi.spyOn(keyvCache, "get");

  const responses = await Promise.all([
    dataSource.fetch("cached-endpoint"),
    dataSource.fetch("cached-endpoint"),
    dataSource.fetch("cached-endpoint"),
  ]);

  // Served from the cache, so the queue must be bypassed
  expect(queueAddSpy).not.toHaveBeenCalled();

  // A single cache lookup reads the key twice: once for the `isCached` check in
  // BaseDataSource, and once when RESTDataSource's HTTPCache reads the response.
  expect(cacheGetSpy).toHaveBeenCalledTimes(2);

  // Check that none of the cache lookups were to keys other than "cached-endpoint"
  expect(cacheGetSpy).not.toHaveBeenCalledWith(
    expect.not.stringContaining("cached-endpoint"),
  );

  for (const response of responses) {
    expect(response.parsedBody).toStrictEqual({ value: "cached-value" });
  }
});

it("sends URL search params bodies as a form", async ({
  server,
  dataSourceConfig,
}) => {
  const requests: { body: string; contentType: string | null }[] = [];

  server.use(
    http.post("**/endpoint", async ({ request }) => {
      requests.push({
        body: await request.text(),
        contentType: request.headers.get("content-type"),
      });

      return HttpResponse.json({ success: true });
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);

  await dataSource.fetch("endpoint", {
    method: "POST",
    body: new URLSearchParams({ name: "value", other: "a&b" }),
  });

  expect(requests).toStrictEqual([
    {
      body: "name=value&other=a%26b",
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    },
  ]);
});

it.for([
  { type: "object", body: { name: "value" } },
  { type: "JSON string", body: JSON.stringify({ name: "value" }) },
])(
  "sends $type bodies as JSON",
  async ({ body }, { server, dataSourceConfig }) => {
    const requests: unknown[] = [];

    server.use(
      http.post("**/endpoint", async ({ request }) => {
        requests.push(await request.json());

        return HttpResponse.json({ success: true });
      }),
    );

    const dataSource = new TestDataSource(dataSourceConfig);

    await dataSource.fetch("endpoint", { method: "POST", body });

    expect(requests).toStrictEqual([{ name: "value" }]);
  },
);

it("rejects string bodies that are not JSON without sending them", async ({
  server,
  dataSourceConfig,
}) => {
  let requestCount = 0;

  server.use(
    http.post("**/endpoint", () => {
      requestCount += 1;

      return HttpResponse.json({ success: true });
    }),
  );

  const dataSource = new TestDataSource(dataSourceConfig);

  await expect(
    dataSource.fetch("endpoint", { method: "POST", body: "name=value" }),
  ).rejects.toThrow(
    "Unable to determine the request body type: invalid JSON string.",
  );
  expect(requestCount).toBe(0);
});

it("rejects with the response of a request that fails with a fatal status", async ({
  server,
  dataSourceConfig,
}) => {
  let requestCount = 0;

  server.use(
    http.get("**/endpoint", () => {
      requestCount += 1;

      return HttpResponse.json(null, { status: 404, statusText: "Not Found" });
    }),
  );

  const dataSource = new TestDataSource({
    ...dataSourceConfig,
    requestBackoffDelay: 0,
  });

  const error = await dataSource
    .fetch("endpoint")
    .catch((fetchError: unknown) => fetchError);

  expect.assert(error instanceof DataSourceHTTPError);
  expect(error.response.status).toBe(404);
  expect(requestCount).toBe(1);
});

it("retries a request that fails with a non-fatal status", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => HttpResponse.json(null, { status: 503 }), {
      once: true,
    }),
    http.get("**/endpoint", () => HttpResponse.json({ success: true })),
  );

  const dataSource = new TestDataSource({
    ...dataSourceConfig,
    requestBackoffDelay: 0,
  });

  await expect(dataSource.fetch("endpoint")).resolves.toMatchObject({
    parsedBody: { success: true },
  });
});

it("rejects a request that fails with a non-fatal status on every attempt", async ({
  server,
  dataSourceConfig,
}) => {
  let requestCount = 0;

  server.use(
    http.get("**/endpoint", () => {
      requestCount += 1;

      return HttpResponse.json(null, { status: 503 });
    }),
  );

  const dataSource = new TestDataSource({
    ...dataSourceConfig,
    requestAttempts: 2,
    requestBackoffDelay: 0,
  });

  await expect(dataSource.fetch("endpoint")).rejects.toBeInstanceOf(
    DataSourceHTTPError,
  );
  expect(requestCount).toBe(2);
});

class RateLimitRecordingDataSource extends TestDataSource {
  public readonly waits: number[] = [];

  protected override didEncounterRateLimit(
    _request: unknown,
    _response: unknown,
    waitMs: number,
  ) {
    this.waits.push(waitMs);
  }
}

it.for([
  { retryAfter: "2", waitMs: 2000 },
  { retryAfter: "0", waitMs: 10_000 },
  { retryAfter: "soon", waitMs: 10_000 },
  { retryAfter: null, waitMs: 10_000 },
])(
  'waits $waitMs ms after a 429 response with a Retry-After of "$retryAfter"',
  async ({ retryAfter, waitMs }, { server, dataSourceConfig }) => {
    server.use(
      http.get("**/endpoint", () =>
        HttpResponse.json(null, {
          status: 429,
          headers: retryAfter === null ? {} : { "Retry-After": retryAfter },
        }),
      ),
    );

    const dataSource = new RateLimitRecordingDataSource({
      ...dataSourceConfig,
      requestAttempts: 1,
    });

    await expect(dataSource.fetch("endpoint")).rejects.toBeInstanceOf(
      DataSourceHTTPError,
    );
    expect(dataSource.waits).toStrictEqual([waitMs]);
  },
);

it("waits until the date given by a Retry-After header", async ({
  server,
  dataSourceConfig,
}) => {
  const retryAt = new Date(Date.now() + 60_000);

  server.use(
    http.get("**/endpoint", () =>
      HttpResponse.json(null, {
        status: 429,
        headers: { "Retry-After": retryAt.toUTCString() },
      }),
    ),
  );

  const dataSource = new RateLimitRecordingDataSource({
    ...dataSourceConfig,
    requestAttempts: 1,
  });

  await expect(dataSource.fetch("endpoint")).rejects.toBeInstanceOf(
    DataSourceHTTPError,
  );

  const [waitMs] = dataSource.waits;

  expect(waitMs).toBeGreaterThan(55_000);
  expect(waitMs).toBeLessThanOrEqual(60_000);
});

it("rate limits the queue and retries after a 429 response", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get(
      "**/endpoint",
      () =>
        HttpResponse.json(null, {
          status: 429,
          headers: { "Retry-After": "1" },
        }),
      { once: true },
    ),
    http.get("**/endpoint", () => HttpResponse.json({ success: true })),
  );

  const dataSource = new TestDataSource(dataSourceConfig);
  const rateLimitSpy = vi.spyOn(dataSource.queue, "rateLimit");

  await expect(dataSource.fetch("endpoint")).resolves.toMatchObject({
    parsedBody: { success: true },
  });
  expect(rateLimitSpy).toHaveBeenCalledExactlyOnceWith(1000);
});

it("resolves a request that finishes before the queue events start reading", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => HttpResponse.json({ success: true })),
  );

  const jobCompleted = Promise.withResolvers<undefined>();
  const { connection } = dataSourceConfig;
  const duplicate = connection.duplicate.bind(connection);

  // BullMQ internals: `QueueEvents` reads the event stream with `xread` on a connection it gets from `connection.duplicate()`.
  // Holding its first read until the job has completed guarantees the job finishes before the queue events start reading.
  vi.spyOn(connection, "duplicate").mockImplementation((() => {
    const client = duplicate();
    const xread = client.xread.bind(client) as (
      ...xreadArgs: unknown[]
    ) => Promise<unknown>;

    vi.spyOn(client, "xread").mockImplementationOnce((async (
      ...xreadArgs: unknown[]
    ) => {
      await jobCompleted.promise;

      return xread(...xreadArgs);
    }) as never);

    return client;
  }) as never);

  const dataSource = new TestDataSource(dataSourceConfig);

  dataSource.worker.once("completed", () => {
    jobCompleted.resolve(undefined);
  });

  await expect(dataSource.fetch("endpoint")).resolves.toMatchObject({
    parsedBody: { success: true },
  });
});

it("recovers after the queue events fail to start", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => HttpResponse.json({ success: true })),
  );

  const startupError = new Error("Redis is unavailable");
  const xrevrangeSpy = vi
    .spyOn(dataSourceConfig.connection, "xrevrange")
    .mockRejectedValue(startupError);
  const errorSpy = vi.spyOn(dataSourceConfig.logger, "error");

  const dataSource = new TestDataSource(dataSourceConfig);

  await expect(dataSource.fetch("endpoint")).rejects.toThrow(
    "Redis is unavailable",
  );

  xrevrangeSpy.mockRestore();

  await expect(dataSource.fetch("endpoint")).resolves.toMatchObject({
    parsedBody: { success: true },
  });
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining("QueueEvents error"),
    { err: startupError },
  );
});

it("force-closes the worker when closing with force", async ({
  dataSourceConfig,
}) => {
  const dataSource = new TestDataSource(dataSourceConfig);
  const workerCloseSpy = vi.spyOn(dataSource.worker, "close");

  await dataSource.close(true);

  expect(workerCloseSpy).toHaveBeenCalledExactlyOnceWith(true);
});

it("logs a failure to close the queue events", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/endpoint", () => HttpResponse.json({ success: true })),
  );

  const closeError = new Error("Close failed");

  // Close for real, so the queue events don't keep the connection open, then report a failure
  vi.spyOn(QueueEvents.prototype, "close").mockImplementationOnce(
    async function closeThenFail(this: QueueEvents) {
      await QueueEvents.prototype.close.call(this);

      throw closeError;
    },
  );

  const errorSpy = vi.spyOn(dataSourceConfig.logger, "error");
  const dataSource = new TestDataSource(dataSourceConfig);

  await dataSource.fetch("endpoint");

  await expect(dataSource.close()).resolves.toBeUndefined();
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringContaining("failed to close"),
    { err: closeError },
  );
});

it("closes without error after the queue events fail to start", async ({
  dataSourceConfig,
}) => {
  vi.spyOn(dataSourceConfig.connection, "xrevrange").mockRejectedValueOnce(
    new Error("Redis is unavailable"),
  );

  const errorSpy = vi.spyOn(dataSourceConfig.logger, "error");
  const dataSource = new TestDataSource(dataSourceConfig);

  await vi.waitFor(() => {
    expect(errorSpy).toHaveBeenCalledOnce();
  });

  await expect(dataSource.close()).resolves.toBeUndefined();
  expect(errorSpy).toHaveBeenCalledOnce();
});
