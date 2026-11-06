import { plugin as cometPlugin } from "@repo/plugin-comet";

import { describe, expect, it } from "vitest";
import z from "zod";

import { GeneralSettings } from "./sections/general-settings.schema.ts";
import { buildSettingsSections } from "./settings-sections.ts";

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

describe(buildSettingsSections, () => {
  const sections = buildSettingsSections({
    installedPlugins,
    pluginEnvironment: new Map([
      ["@repo/plugin-comet", { url: "https://comet.example" }],
      ["@repo/plugin-invalid", { foo: "bar" }],
    ]),
    coreEnvironment: { logLevel: "debug" },
  });

  it("builds the general section and one section per installed plugin", () => {
    expect([...sections.keys()]).toStrictEqual([
      "general",
      "repo-plugin-comet",
      "repo-plugin-listrr",
    ]);
  });

  it("builds the general section in the core namespace", () => {
    expect(sections.get("general")).toStrictEqual({
      id: "general",
      namespace: "riven",
      title: "General",
      schema: GeneralSettings,
      environment: { logLevel: "debug" },
    });
  });

  it("uses the plugin package name as the namespace and the schema title", () => {
    expect(sections.get("repo-plugin-comet")).toStrictEqual({
      id: "repo-plugin-comet",
      namespace: "@repo/plugin-comet",
      title: "Comet",
      schema: cometPlugin.settingsSchema,
      environment: { url: "https://comet.example" },
    });
  });

  it("falls back to the package name when the schema has no title", () => {
    expect(sections.get("repo-plugin-listrr")).toMatchObject({
      title: "@repo/plugin-listrr",
      environment: {},
    });
  });
});
