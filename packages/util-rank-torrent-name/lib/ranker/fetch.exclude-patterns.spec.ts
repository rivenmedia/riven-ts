import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("rejects when exclude pattern matches", ({ rankingModel }) => {
  const settings = createSettings({ exclude: ["CAM"] });
  const data = parse("Movie.2024.CAM-GROUP");
  const result = checkFetch(data, settings, rankingModel);
  expect(result.fetch).toBe(false);
});

it("accepts when exclude pattern does not match", ({ rankingModel }) => {
  const settings = createSettings({ exclude: ["CAM"] });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);
  expect(result.fetch).toBe(true);
});
