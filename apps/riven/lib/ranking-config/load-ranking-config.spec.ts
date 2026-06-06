import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { it as baseIt, describe, expect } from "vitest";

import { loadRankingConfig } from "./load-ranking-config.ts";
import { defaultPreset } from "./presets/default-preset.ts";

import type { RankingConfigFileContents } from "./ranking-config.schema.ts";
import type { PartialDeep } from "type-fest";

const it = baseIt.extend("tempDir", async ({}, { onCleanup }) => {
  const dir = await mkdtemp(path.join(tmpdir(), "riven-ranking-config-test-"));

  onCleanup(async () => {
    await rm(dir, { recursive: true });
  });

  return dir;
});

async function writeValidConfigFile(
  configPath: string,
  content: PartialDeep<RankingConfigFileContents>,
) {
  await writeFile(configPath, JSON.stringify(content), "utf8");
}

async function writeInvalidConfigFile(configPath: string, content: string) {
  await writeFile(configPath, content, "utf8");
}

describe("when the config file does not exist", () => {
  it("creates the file", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await expect(stat(configPath)).rejects.toThrow();

    await loadRankingConfig(configPath);

    await expect(stat(configPath)).resolves.toBeTruthy();
  });

  it("writes valid JSON to the created file", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await loadRankingConfig(configPath);

    const content = await readFile(configPath, "utf8");

    expect(() => JSON.parse(content)).not.toThrow();
  });

  it("creates a ranking config using the default preset", async ({
    tempDir,
  }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await loadRankingConfig(configPath);

    const content = JSON.parse(await readFile(configPath, "utf8"));

    expect(content).toMatchObject({
      preset: "default",
    });
  });
});

describe("when the config file exists and is valid", () => {
  it("loads custom settings from the file", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeValidConfigFile(configPath, {
      preset: "custom",
      settings: {
        exclude: ["\\btest\\b"],
        resolutions: { r1080p: false, r720p: false },
      },
    });

    const { settings } = await loadRankingConfig(configPath);

    expect(settings.exclude).toEqual(["\\btest\\b"]);
    expect(settings.resolutions.r1080p).toBe(false);
    expect(settings.resolutions.r720p).toBe(false);
  });

  it("loads custom ranking model values from the file", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeValidConfigFile(configPath, {
      preset: "custom",
      rankingModel: { webdl: 9999, remux: 5000 },
    });

    const { rankingModel } = await loadRankingConfig(configPath);

    expect(rankingModel.webdl).toBe(9999);
    expect(rankingModel.remux).toBe(5000);
  });

  it("applies schema defaults for fields not present in the file", async ({
    tempDir,
  }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeValidConfigFile(configPath, { preset: "custom" });

    const { settings, rankingModel } = await loadRankingConfig(configPath);

    expect(settings.resolutions.r1080p).toBe(true);
    expect(rankingModel.av1).toBe(0);
  });
});

describe("when the config file contains invalid JSON", () => {
  it("throws an error with a descriptive message", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeInvalidConfigFile(configPath, "{ this is not valid json }");

    await expect(loadRankingConfig(configPath)).rejects.toThrow(
      /invalid JSON/i,
    );
  });

  it("includes the file path in the error message", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeInvalidConfigFile(configPath, "{bad}");

    await expect(loadRankingConfig(configPath)).rejects.toThrow(
      new RegExp(path.basename(configPath).replace(".", "\\.")),
    );
  });
});

describe("when the config contains unknown keys", () => {
  it("rejects unknown top-level keys", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeInvalidConfigFile(
      configPath,
      JSON.stringify({ preset: "custom", unknownTopLevelKey: true }),
    );

    await expect(loadRankingConfig(configPath)).rejects.toThrow(
      'unrecognized key(s) "unknownTopLevelKey"',
    );
  });
});

describe("when the config contains invalid values for valid keys", () => {
  it("throws an error when settings has invalid values", async ({
    tempDir,
  }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeInvalidConfigFile(
      configPath,
      JSON.stringify({
        preset: "custom",
        settings: { resolutions: { r1080p: "yes" } },
      }),
    );

    await expect(loadRankingConfig(configPath)).rejects.toThrow(
      "settings.resolutions.r1080p",
    );
  });

  it("throws an error when rankingModel has invalid values", async ({
    tempDir,
  }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeInvalidConfigFile(
      configPath,
      JSON.stringify({ preset: "custom", rankingModel: { webdl: "high" } }),
    );

    await expect(loadRankingConfig(configPath)).rejects.toThrow(
      "rankingModel.webdl",
    );
  });
});

describe('when the preset is "default"', () => {
  it("applies the default preset", async ({ tempDir }) => {
    const configPath = path.join(tempDir, "ranking-config.json");

    await writeValidConfigFile(configPath, {
      preset: "default",
    });

    const rankingConfig = await loadRankingConfig(configPath);

    expect(rankingConfig).toMatchObject(defaultPreset);
  });
});
