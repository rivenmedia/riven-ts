import { KeyvAdapter } from "@apollo/utils.keyvadapter";
import { HttpResponse, http } from "msw";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";
import { createLogger } from "winston";

import { it as baseIt } from "../__tests__/test-context.ts";
import { BaseDataSource, type BaseDataSourceConfig } from "./index.ts";

import type { Promisable } from "type-fest";

class TestDataSource extends BaseDataSource<Record<string, unknown>> {
  override baseURL = "https://example.com/api";

  override validate(): Promisable<boolean> {
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

  expect(firstRequest.parsedBody).toEqual({ success: false });

  const secondRequest = await dataSource.fetch("endpoint");

  expect(secondRequest.parsedBody).toEqual({ success: true });
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

  expect(queueAddSpy).toHaveBeenCalledTimes(1);
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

  expect(secondRequest.parsedBody).toEqual({ value: "cached-value" });
});
