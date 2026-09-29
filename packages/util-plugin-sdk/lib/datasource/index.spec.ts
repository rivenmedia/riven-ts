import { KeyvAdapter } from "@apollo/utils.keyvadapter";
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
