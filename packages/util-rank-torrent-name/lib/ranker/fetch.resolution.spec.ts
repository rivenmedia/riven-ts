import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("rejects 2160p by default", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.2160p.WEB-DL.HEVC-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("resolution");
});

it("accepts 1080p by default", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(true);
});

it("accepts 720p by default", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.720p.WEB-DL.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(true);
});

it("rejects 480p by default", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.480p.WEB-DL.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("resolution");
});

it("accepts unknown resolution by default", ({ settings, rankingModel }) => {
  const data = parse("Movie 2024-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  // Unknown resolution is enabled by default
  expect(result.failedChecks).not.toContain("resolution_unknown");
});

it("rejects unknown resolution when disabled", ({ rankingModel }) => {
  const settings = createSettings({ resolutions: { unknown: false } });
  const data = parse("Movie 2024-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("resolution_unknown");
});
