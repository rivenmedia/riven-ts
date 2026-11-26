import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";

it("rejects AV1 by default", ({ settings, rankingModel }) => {
  const data = parse("Movie.2024.1080p.WEB-DL.AV1-GROUP");
  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect(result.failedChecks).toContain("av1");
});
