import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, vi } from "vitest";
import { createActor, createEmptyActor, fromPromise, toPromise } from "xstate";

import { deadStreamLinkScenario } from "#mocks/scenarios/dead-stream-link.scenario.ts";
import { DEFAULT_PRESET_SLUG } from "#ranking/presets/index.ts";
import { syncRankingProfiles as realSyncRankingProfiles } from "#state-machines/bootstrap/actors/sync-ranking-profiles.actor.ts";
import { settings } from "#utilities/settings.ts";

import { it } from "./helpers/test-context.ts";

import type { SyncRankingProfilesInput } from "#state-machines/bootstrap/actors/sync-ranking-profiles.actor.ts";

describe("when ranking profiles sync successfully", () => {
  const syncRankingProfiles =
    vi.fn<(input: SyncRankingProfilesInput) => void>();

  it.override({
    syncRankingProfilesActorLogic: fromPromise<
      undefined,
      SyncRankingProfilesInput
    >(async ({ input }) => {
      syncRankingProfiles(input);

      return Promise.resolve(undefined);
    }),
  });

  it("syncs after loading runtime settings and before bootstrapping plugins", async ({
    actor,
  }) => {
    const visitedStates: unknown[] = [];

    actor.subscribe(({ value }) => {
      if (visitedStates.at(-1) !== value) {
        visitedStates.push(value);
      }
    });

    await toPromise(actor.start());

    const syncIndex = visitedStates.indexOf("Syncing ranking profiles");

    expect(syncIndex).toBeGreaterThan(
      visitedStates.indexOf("Loading runtime settings"),
    );
    expect(syncIndex).toBeLessThan(
      visitedStates.indexOf("Bootstrapping plugins"),
    );
  });

  it("passes the services and the legacy ranking config path", async ({
    actor,
    services,
  }) => {
    await toPromise(actor.start());

    expect(syncRankingProfiles).toHaveBeenCalledWith({
      rankingProfileService: services.rankingProfileService,
      settingsService: services.settingsService,
      legacyConfigPath: settings.rankingConfigPath,
    });
  });
});

describe("when syncing ranking profiles fails", () => {
  it.override({
    syncRankingProfilesActorLogic: fromPromise<
      undefined,
      SyncRankingProfilesInput
    >(() => Promise.reject(new Error("Invalid ranking config file"))),
  });

  it("fails the bootstrap", async ({ actor }) => {
    await expect(toPromise(actor.start())).rejects.toThrow(
      "Invalid ranking config file",
    );
  });
});

describe("when a mock scenario is applied", () => {
  it.override({
    input: {
      rootRef: createEmptyActor(),
      mainRunnerRef: createEmptyActor(),
      mockScenario: deadStreamLinkScenario,
    },
    // The real sync, pointed at a legacy config path that does not exist.
    syncRankingProfilesActorLogic: fromPromise<
      undefined,
      SyncRankingProfilesInput
    >(async ({ input }) => {
      const dir = await mkdtemp(path.join(tmpdir(), "riven-bootstrap-sync-"));

      try {
        await toPromise(
          createActor(realSyncRankingProfiles, {
            input: {
              ...input,
              legacyConfigPath: path.join(dir, "missing.json"),
            },
          }).start(),
        );
      } finally {
        await rm(dir, { recursive: true });
      }
    }),
  });

  it("syncs ranking profiles after the scenario resets the database", async ({
    actor,
    services,
  }) => {
    const visitedStates: unknown[] = [];

    actor.subscribe(({ value }) => {
      if (visitedStates.at(-1) !== value) {
        visitedStates.push(value);
      }
    });

    await toPromise(actor.start());

    const syncIndex = visitedStates.indexOf("Syncing ranking profiles");

    expect(syncIndex).toBeGreaterThan(
      visitedStates.indexOf("Applying mock scenario"),
    );
    expect(syncIndex).toBeLessThan(
      visitedStates.indexOf("Bootstrapping plugins"),
    );
    await expect(
      services.rankingProfileService.findBySlug(DEFAULT_PRESET_SLUG),
    ).resolves.toMatchObject({ builtIn: true });
  });
});
