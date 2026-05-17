import { HttpResponse, http } from "msw";
import { expect, vi } from "vitest";
import { createLogger } from "winston";

import { it } from "../__tests__/test-context.ts";
import { BaseDataSource } from "./index.ts";

import type { Promisable } from "type-fest";

class TestDataSource extends BaseDataSource<Record<string, unknown>> {
  override baseURL = "https://example.com/api";

  override validate(): Promisable<boolean> {
    return true;
  }
}

it("does not drop subsequent jobs to the same URL", async ({
  server,
  redisClient,
}) => {
  interface MockResponse {
    success: boolean;
  }

  server.use(
    http.get(
      "**/endpoint",
      () => HttpResponse.json<MockResponse>({ success: false }),
      { once: true },
    ),
    http.get(
      "**/endpoint",
      () => HttpResponse.json<MockResponse>({ success: true }),
      { once: true },
    ),
  );

  const dataSource = new TestDataSource({
    settings: {},
    connection: redisClient,
    logger: createLogger({ silent: true }),
    pluginSymbol: Symbol.for("@repo/plugin-test"),
    telemetry: undefined as never,
    cache: {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    },
  });

  const firstRequest = await dataSource.fetch<MockResponse>("endpoint");

  expect(firstRequest.parsedBody).toEqual({ success: false });

  const secondRequest = await dataSource.fetch<MockResponse>("endpoint");

  expect(secondRequest.parsedBody).toEqual({ success: true });
});
