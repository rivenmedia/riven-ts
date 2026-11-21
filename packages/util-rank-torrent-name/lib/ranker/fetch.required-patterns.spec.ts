import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("passes when required pattern matches", ({ rankingModel }) => {
  const settings = createSettings({ require: ["1080p"] });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);
  expect(result.fetch).toBe(true);
});

it("handles case-sensitive patterns with slashes", ({ rankingModel }) => {
  // Use require with a case-sensitive pattern that won't match the raw title
  // and also add a resolution filter that would normally reject it
  const settings = createSettings({
    require: ["/1080P/"],
    resolutions: { r1080p: false, unknown: false },
  });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);
  // Case-sensitive "/1080P/" won't match "1080p", so require doesn't short-circuit.
  // With r1080p disabled, the torrent should be rejected.
  expect(result.fetch).toBe(false);
});

it("handles case-insensitive patterns without slashes", ({ rankingModel }) => {
  const settings = createSettings({ require: ["1080P"] });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const result = checkFetch(data, settings, rankingModel);
  expect(result.fetch).toBe(true);
});
