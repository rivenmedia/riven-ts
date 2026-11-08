import { plugin as cometPlugin } from "@repo/plugin-comet";

import { describe, expect } from "vitest";
import z from "zod";

import { it } from "#__tests__/test-context.ts";
import { rankingPresets } from "#ranking/presets/index.ts";
import {
  RANKING_NAMESPACE,
  RankingSettingsSection,
} from "#ranking/ranking-settings-section.schema.ts";

import { GeneralSettings } from "./sections/general-settings.schema.ts";
import { buildSettingsSections } from "./settings-sections.ts";

import type { Services } from "#database/database.ts";
import type { InstalledPlugin } from "#types/plugins.ts";

const untitledSchema = z.object({ foo: z.string().default("bar") });

const installedPlugins: InstalledPlugin[] = [
  {
    sectionId: "repo-plugin-comet",
    packageName: "@repo/plugin-comet",
    name: "comet",
    plugin: cometPlugin,
    enabled: true,
    alwaysEnabled: false,
  },
  {
    sectionId: "repo-plugin-listrr",
    packageName: "@repo/plugin-listrr",
    name: "listrr",
    plugin: { ...cometPlugin, settingsSchema: untitledSchema },
    enabled: false,
    alwaysEnabled: false,
  },
];

const build = (services: Services) =>
  buildSettingsSections({
    installedPlugins,
    pluginEnvironment: new Map([
      ["@repo/plugin-comet", { url: "https://comet.example" }],
      ["@repo/plugin-invalid", { foo: "bar" }],
    ]),
    coreEnvironment: { logLevel: "debug" },
    rankingProfileService: services.rankingProfileService,
    settingsService: services.settingsService,
  });

describe(buildSettingsSections, () => {
  it("builds the general and ranking sections and one section per installed plugin", ({
    services,
  }) => {
    const sections = build(services);

    expect([...sections.keys()]).toStrictEqual([
      "general",
      "ranking",
      "repo-plugin-comet",
      "repo-plugin-listrr",
    ]);
  });

  it("builds the general section in the core namespace", ({ services }) => {
    const sections = build(services);

    expect(sections.get("general")).toStrictEqual({
      id: "general",
      namespace: "riven",
      title: "General",
      schema: GeneralSettings,
      environment: { logLevel: "debug" },
    });
  });

  it("uses the plugin package name as the namespace and the schema title", ({
    services,
  }) => {
    const sections = build(services);

    expect(sections.get("repo-plugin-comet")).toStrictEqual({
      id: "repo-plugin-comet",
      namespace: "@repo/plugin-comet",
      title: "Comet",
      schema: cometPlugin.settingsSchema,
      environment: { url: "https://comet.example" },
    });
  });

  it("falls back to the package name when the schema has no title", ({
    services,
  }) => {
    const sections = build(services);

    expect(sections.get("repo-plugin-listrr")).toMatchObject({
      title: "@repo/plugin-listrr",
      environment: {},
    });
  });

  it("builds a hot ranking section with the core environment", ({
    services,
  }) => {
    const sections = build(services);

    expect(sections.get("ranking")).toStrictEqual({
      id: "ranking",
      namespace: RANKING_NAMESPACE,
      title: "Ranking Settings",
      schema: RankingSettingsSection,
      environment: { logLevel: "debug" },
      hot: true,
      resolveDefaults: expect.any(Function),
    });
  });

  it("resolves the ranking defaults from the active profile over the schema defaults", async ({
    services,
  }) => {
    await services.rankingProfileService.syncPresets(rankingPresets);

    const profile = await services.rankingProfileService.create({
      name: "Strict",
      description: null,
      config: {
        settings: {
          exclude: ["CAM"],
          resolutions: { r2160p: true },
          languages: { exclude: ["fr"] },
        },
      },
    });

    await services.settingsService.writeValues(RANKING_NAMESPACE, {
      upsert: { activeProfileId: profile.id },
      delete: [],
    });

    const defaults = await build(services).get("ranking")?.resolveDefaults?.();

    expect(defaults).toMatchObject({
      excludedPatterns: ["CAM"],
      r2160p: true,
      r1080p: true,
      excludedLanguages: ["fr"],
      removeAllTrash: true,
    });
  });
});
