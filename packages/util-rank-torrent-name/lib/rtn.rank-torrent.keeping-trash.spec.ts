import { expect, it as baseIt } from "vitest";

import { HASH, createRtn } from "./__tests__/create-rtn.ts";

import type { SettingsInput } from "./ranker/ranking-settings.schema.ts";

const it = baseIt.extend(
  "settings",
  () =>
    ({
      options: { removeAllTrash: false, removeRanksUnder: 1000 },
    }) satisfies SettingsInput,
);

it("ranks a torrent that fails the checks and reports why", ({ settings }) => {
  const result = createRtn(settings).rankTorrent(
    "Inception 2010 1080p CAM x264",
    HASH,
    "The Matrix",
    {},
  );

  expect(result.fetch).toBe(false);
  // The trash checks only apply when removing trash, leaving the ranking model's checks
  expect(result.failedChecks).toStrictEqual(new Set(["cam"]));
  expect(result.levRatio).toBeLessThan(0.85);
  expect(result.rank).toBeLessThan(1000);
});
