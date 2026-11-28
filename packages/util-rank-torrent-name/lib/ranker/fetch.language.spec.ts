import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("rejects unknown languages when configured", ({ rankingModel }) => {
  const settings = createSettings({
    options: { removeUnknownLanguages: true },
  });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("unknown_language");
});

it("does not reject unknown languages by default", ({
  settings,
  rankingModel,
}) => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.failedChecks).not.toContain("unknown_language");
});

it("rejects excluded language", ({ rankingModel }) => {
  const settings = createSettings({
    languages: { exclude: ["fr"] },
  });
  const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("lang_fr");
});

it("accepts allowed language even if also excluded", ({ rankingModel }) => {
  const settings = createSettings({
    languages: { allowed: ["fr"], exclude: ["fr"] },
  });
  const data = parse("Movie.2024.FRENCH.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(true);
});

it("requires language when required is set", ({ rankingModel }) => {
  const settings = createSettings({
    languages: { required: ["en"] },
  });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("missing_required_language");
});
