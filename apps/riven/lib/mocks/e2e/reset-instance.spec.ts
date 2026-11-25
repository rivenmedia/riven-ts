import { plugin as testPlugin } from "@repo/plugin-test";

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { e2eBaselineScenario } from "#mocks/scenarios/e2e-baseline.scenario.ts";
import { SettingsManager } from "#settings/settings-manager.ts";
import { buildSettingsSections } from "#settings/settings-sections.ts";

import { resetInstance } from "./reset-instance.ts";

import type { CorePluginName } from "#schemas/core-plugins.schema.ts";
import type { InstalledPlugin } from "#types/plugins.ts";

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
