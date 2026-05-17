import { describe, expect } from "vitest";

import { it } from "../../__tests__/listrr.test-context.ts";
import plugin from "../../index.ts";

describe("listrr plugin hooks", () => {
  it("content-service.requested returns movies and shows", async ({
    dataSourceMap,
    settings,
  }) => {
    const hook = plugin.hooks["riven.content-service.requested"];
    const result = await hook({
      dataSources: dataSourceMap,
      settings,
      event: {},
    } as Parameters<typeof hook>[0]);

    expect(result.movies).toEqual([]);
    expect(result.shows).toEqual([]);
    expect(result.updateIntervalSeconds).toBeDefined();
  });
});
