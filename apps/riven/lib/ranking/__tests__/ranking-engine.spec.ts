import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import { rankingPresets } from "../presets/index.ts";
import {
  getRankingEngine,
  invalidateRankingEngine,
} from "../ranking-engine.ts";

const TITLE = "Some Movie 2020 1080p AV1";

const it = baseIt.extend("deps", ({ services }) => ({
  rankingProfileService: services.rankingProfileService,
  settingsService: services.settingsService,
  environment: {},
}));

const rankOf = (rtn: Awaited<ReturnType<typeof getRankingEngine>>) =>
  rtn.rankTorrent(TITLE, "a".repeat(40), "Some Movie", {}).rank;

it.beforeEach(({ deps }) => {
  invalidateRankingEngine();

  return deps.rankingProfileService.syncPresets(rankingPresets);
});

it("ranks with the active profile", async ({ deps }) => {
  const defaultRank = rankOf(await getRankingEngine(deps));

  const custom = await deps.rankingProfileService.create({
    name: "AV1",
    description: null,
    config: { rankingModel: { av1: 9999 } },
  });

  await deps.settingsService.writeValues("riven-ranking", {
    upsert: { activeProfileId: custom.id },
    delete: [],
  });
  invalidateRankingEngine();

  expect(rankOf(await getRankingEngine(deps))).toBe(defaultRank + 9499);
});

it("falls back to the default preset when the active profile is missing", async ({
  deps,
}) => {
  const before = rankOf(await getRankingEngine(deps));

  await deps.settingsService.writeValues("riven-ranking", {
    upsert: { activeProfileId: crypto.randomUUID() },
    delete: [],
  });
  invalidateRankingEngine();

  expect(rankOf(await getRankingEngine(deps))).toBe(before);
});

it("applies global ranking settings over the profile", async ({ deps }) => {
  await deps.settingsService.writeValues("riven-ranking", {
    upsert: { r2160p: true, r1080p: false },
    delete: [],
  });
  invalidateRankingEngine();

  const rtn = await getRankingEngine(deps);

  expect(() =>
    rtn.rankTorrent("Some Movie 2020 1080p", "b".repeat(40), "Some Movie", {}),
  ).toThrow(/Garbage torrent detected/u);
});

it("uses the active profile's settings when no global overrides are stored", async ({
  deps,
}) => {
  const profile = await deps.rankingProfileService.create({
    name: "4K only",
    description: null,
    config: { settings: { resolutions: { r2160p: true } } },
  });

  await deps.settingsService.writeValues("riven-ranking", {
    upsert: { activeProfileId: profile.id },
    delete: [],
  });
  invalidateRankingEngine();

  const rtn = await getRankingEngine(deps);

  // The schema default (`r2160p: false`) must not leak in as a global override.
  expect(() =>
    rtn.rankTorrent("Some Movie 2020 2160p", "c".repeat(40), "Some Movie", {}),
  ).not.toThrow();
});

it("returns the cached instance until invalidated", async ({ deps }) => {
  const a = await getRankingEngine(deps);

  await expect(getRankingEngine(deps)).resolves.toBe(a);

  invalidateRankingEngine();

  await expect(getRankingEngine(deps)).resolves.not.toBe(a);
});

it("shares one in-flight build between concurrent callers", async ({
  deps,
}) => {
  const [a, b] = await Promise.all([
    getRankingEngine(deps),
    getRankingEngine(deps),
  ]);

  expect(a).toBe(b);
});
