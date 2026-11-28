import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createRankingModel } from "./ranking-settings.schema.ts";

it("rejects REMUX by default (fetch: false)", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("remux");
});

it("accepts REMUX when ranking model allows fetch", ({ settings }) => {
  const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC-GROUP");
  const result = checkFetch(data, settings, createRankingModel({ remux: 0 }));

  // Should not fail on remux
  expect(result.failedChecks).not.toContain("remux");
});
