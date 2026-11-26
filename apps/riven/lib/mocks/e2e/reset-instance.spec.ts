import { plugin as testPlugin } from "@repo/plugin-test";

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { queueRegistry } from "#message-queue/utilities/queue-registry.ts";
import { e2eBaselineScenario } from "#mocks/scenarios/e2e-baseline.scenario.ts";
import { SettingsManager } from "#settings/settings-manager.ts";
import { buildSettingsSections } from "#settings/settings-sections.ts";

import { quiesceQueues, resetInstance } from "./reset-instance.ts";

import type { CorePluginName } from "#schemas/core-plugins.schema.ts";
import type { InstalledPlugin } from "#types/plugins.ts";
import type { Queue } from "bullmq";

// `node.ts` refuses to load outside of a mock scenario, so stand in for its handler facade.
vi.mock(import("#mocks/node.ts"), () => ({
  server: {
    use: () => undefined,
    resetHandlers: () => undefined,
    close: () => undefined,
  },
}));

const installedPlugins: InstalledPlugin[] = [
  {
    sectionId: "repo-plugin-test",
    packageName: "@repo/plugin-test",
    // The test package.json mock makes `test` the only valid core plugin name.
    name: "test" as CorePluginName,
    plugin: testPlugin,
    enabled: false,
    alwaysEnabled: false,
  },
];

const it = baseIt
  // Keeps the legacy ranking config import away from any file in the working directory.
  .extend("emptyWorkingDirectory", async ({}, { onCleanup }) => {
    const dir = await mkdtemp(path.join(tmpdir(), "riven-e2e-reset-"));

    vi.spyOn(process, "cwd").mockReturnValue(dir);

    onCleanup(async () => {
      await rm(dir, { recursive: true });
    });

    return dir;
  })
  // Registers a fake queue, whose active job count is scripted per test.
  .extend("registerQueue", ({}, { onCleanup }) => {
    const names: string[] = [];

    onCleanup(() => {
      for (const name of names) {
        queueRegistry.delete(name);
      }
    });

    return (name: string, getActiveCount: () => Promise<number>) => {
      const queue = {
        pause: vi.fn<() => Promise<void>>(() => Promise.resolve()),
        getActiveCount: vi.fn<() => Promise<number>>(getActiveCount),
      };

      names.push(name);
      queueRegistry.set(name, queue as unknown as Queue);

      return queue;
    };
  })
  .extend(
    "settingsManager",
    ({ services, emptyWorkingDirectory: _ }) =>
      new SettingsManager({
        settingsService: services.settingsService,
        sections: buildSettingsSections({
          installedPlugins,
          pluginEnvironment: new Map(),
          coreEnvironment: {},
          rankingProfileService: services.rankingProfileService,
          settingsService: services.settingsService,
        }),
        installedPlugins,
        coreEnvironment: {},
      }),
  );

it("enables a plugin that a test disabled, without requiring a restart", async ({
  orm,
  services,
  settingsManager,
}) => {
  const deps = { orm, services, settingsManager };

  await resetInstance(deps, e2eBaselineScenario);

  await expect(
    settingsManager.setPluginEnabled("repo-plugin-test", false),
  ).resolves.toStrictEqual([]);
  expect(settingsManager.restartRequired).toBe(true);
  await expect(settingsManager.listPlugins()).resolves.toMatchObject({
    plugins: [{ id: "repo-plugin-test", enabled: false }],
  });

  await resetInstance(deps, e2eBaselineScenario);

  expect(settingsManager.restartRequired).toBe(false);
  await expect(settingsManager.listPlugins()).resolves.toMatchObject({
    plugins: [{ id: "repo-plugin-test", enabled: true }],
    enabledPluginsLocked: false,
  });
});

it("waits for an active job to finish before clearing the database", async ({
  orm,
  services,
  settingsManager,
  registerQueue,
}) => {
  const counts = [1, 1, 0];
  const queue = registerQueue("e2e-reset-active", () =>
    Promise.resolve(counts.shift() ?? 0),
  );
  const clear = vi.spyOn(orm.schema, "clear");

  await resetInstance({ orm, services, settingsManager }, e2eBaselineScenario);

  expect(queue.getActiveCount).toHaveBeenCalledTimes(3);
  expect(clear.mock.invocationCallOrder[0]).toBeGreaterThan(
    queue.getActiveCount.mock.invocationCallOrder[2] ?? Infinity,
  );
});

it("pauses every registered queue before it waits", async ({
  registerQueue,
}) => {
  const first = registerQueue("e2e-reset-first", () => Promise.resolve(0));
  const second = registerQueue("e2e-reset-second", () => Promise.resolve(0));

  await quiesceQueues();

  const lastPause = Math.max(
    ...[first, second].map(
      ({ pause }) => pause.mock.invocationCallOrder[0] ?? 0,
    ),
  );
  const firstPoll = Math.min(
    ...[first, second].map(
      ({ getActiveCount }) =>
        getActiveCount.mock.invocationCallOrder[0] ?? Infinity,
    ),
  );

  expect(first.pause).toHaveBeenCalledOnce();
  expect(second.pause).toHaveBeenCalledOnce();
  expect(lastPause).toBeLessThan(firstPoll);
});

it("fails the reset when a job is still active after the timeout", async ({
  orm,
  registerQueue,
}) => {
  registerQueue("e2e-reset-stuck", () => Promise.resolve(1));
  const clear = vi.spyOn(orm.schema, "clear");

  await expect(quiesceQueues(50)).rejects.toThrow(
    /still active.*e2e-reset-stuck/u,
  );
  expect(clear).not.toHaveBeenCalled();
});
