import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("accepts a standard 1080p BluRay", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(true);
  expect(result.failedChecks).toHaveLength(0);
});

it("rejects CAM quality when removeAllTrash is true", ({
  settings,
  rankingModel,
}) => {
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("trash_quality");
});

it("rejects TeleSync quality", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.TS-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
});

it("accepts CAM when removeAllTrash is false", ({ rankingModel }) => {
  const settings = createSettings({ options: { removeAllTrash: false } });
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("cam");
});
