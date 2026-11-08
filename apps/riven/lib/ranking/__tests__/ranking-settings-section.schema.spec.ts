import { describe, expect, it } from "vitest";

import { RivenSettings } from "#riven-settings.schema.ts";
import { RuntimeSettings } from "#settings/core-settings-sections.ts";
import { buildSectionJsonSchema } from "#settings/utilities/build-section-json-schema.ts";
import {
  getLeafDefault,
  getLeafPaths,
} from "#settings/utilities/leaf-paths.ts";

import {
  fromRtnSettingsInput,
  RankingSettingsSection,
  toRtnSettingsInput,
} from "../ranking-settings-section.schema.ts";

import type { SettingsInput } from "@repo/util-rank-torrent-name";

describe("ranking settings section adapter", () => {
  it("round-trips RTN settings", () => {
    const rtn: SettingsInput = {
      exclude: ["x"],
      resolutions: { r2160p: true, unknown: false },
      languages: { exclude: ["fr"] },
      options: { titleSimilarity: 0.9 },
    };

    expect(toRtnSettingsInput(fromRtnSettingsInput(rtn))).toStrictEqual(rtn);
  });

  it("emits nothing for an empty section", () => {
    expect(toRtnSettingsInput({})).toStrictEqual({});
    expect(fromRtnSettingsInput({})).toStrictEqual({});
  });

  it("has unique leaves that don't collide with any other core setting or env key", () => {
    const leaves = new Set(getLeafPaths(RankingSettingsSection).keys());
    const others = [
      ...getLeafPaths(RuntimeSettings.shape.general).keys(),
      ...getLeafPaths(RuntimeSettings.shape.plugins).keys(),
      ...Object.keys(RivenSettings.shape),
    ];

    expect(others.filter((key) => leaves.has(key))).toStrictEqual([]);
  });

  it("serves RTN defaults as leaf defaults", () => {
    expect(getLeafDefault(RankingSettingsSection, "r1080p")).toBe(true);
    expect(getLeafDefault(RankingSettingsSection, "titleSimilarity")).toBe(
      0.85,
    );
  });

  it("serves a title for each group", () => {
    const { properties = {} } = buildSectionJsonSchema(
      RankingSettingsSection,
      new Map(),
    );

    expect(
      Object.fromEntries(
        Object.entries(properties).map(([group, node]) => [
          group,
          typeof node === "object"
            ? { title: node.title, description: node.description }
            : undefined,
        ]),
      ),
    ).toStrictEqual({
      patterns: { title: "Patterns", description: undefined },
      resolutions: {
        title: "Resolutions",
        description: "Enable / disable specific resolutions",
      },
      options: {
        title: "Options",
        description: "Configure various options for torrent ranking",
      },
      languages: {
        title: "Languages",
        description: "Configure language preferences for torrents",
      },
    });
  });

  it("is titled for the settings UI", () => {
    expect(RankingSettingsSection.meta()?.title).toBe("Ranking Settings");
  });
});
