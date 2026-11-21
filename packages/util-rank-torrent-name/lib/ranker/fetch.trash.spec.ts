import { expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { it } from "./__tests__/fetch.test-context.ts";
import { checkFetch } from "./fetch.ts";
import { createSettings } from "./ranking-settings.schema.ts";

it("rejects releases the parser flags as trash", ({
  settings,
  rankingModel,
}) => {
  const data = parse("Movie.2024.1080p.WEB-DL.HQ.Clean.Audio.x264-GROUP");

  expect(data.trash).toBe(true);

  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(false);
  expect([...result.failedChecks]).toStrictEqual(["trash_flag"]);
});

it("accepts releases flagged as trash when removeAllTrash is false", ({
  rankingModel,
}) => {
  const settings = createSettings({ options: { removeAllTrash: false } });
  const data = parse("Movie.2024.1080p.WEB-DL.HQ.Clean.Audio.x264-GROUP");

  const result = checkFetch(data, settings, rankingModel);

  expect(result.fetch).toBe(true);
  expect([...result.failedChecks]).toStrictEqual([]);
});
