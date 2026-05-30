import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_RANKING_MODEL_INPUT,
  DEFAULT_SETTINGS_INPUT,
  loadRankingConfig,
} from "./load-ranking-config.ts";

function withTempDir(fn: (dir: string) => void) {
  const dir = mkdtempSync(path.join(tmpdir(), "riven-ranking-config-test-"));

  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true });
  }
}

describe("when the config file does not exist", () => {
  it("creates the file with the default values", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      loadRankingConfig(configPath);

      expect(existsSync(configPath)).toBe(true);
    });
  });

  it("returns the default settings", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      const { settings } = loadRankingConfig(configPath);

      expect(settings).toMatchObject(DEFAULT_SETTINGS_INPUT);
    });
  });

  it("returns the default ranking model", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      const { rankingModel } = loadRankingConfig(configPath);

      expect(rankingModel).toMatchObject(DEFAULT_RANKING_MODEL_INPUT);
    });
  });

  it("writes valid JSON to the created file", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      loadRankingConfig(configPath);

      const content = readFileSync(configPath, "utf8");

      expect(() => JSON.parse(content)).not.toThrow();
    });
  });

  it("includes all expected top-level keys in the created file", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      loadRankingConfig(configPath);

      const content = JSON.parse(readFileSync(configPath, "utf8"));

      expect(content).toMatchObject({
        settings: expect.objectContaining(DEFAULT_SETTINGS_INPUT),
        rankingModel: expect.objectContaining(DEFAULT_RANKING_MODEL_INPUT),
      });
    });
  });

  it("does not call warn", async () => {
    const { logger } = await import("../utilities/logger/logger.ts");
    const warnSpy = vi.spyOn(logger, "warn");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      loadRankingConfig(configPath);

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});

describe("when the config file exists and is valid", () => {
  it("loads custom settings from the file", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({
          settings: {
            exclude: ["\\btest\\b"],
            resolutions: { r1080p: false, r720p: false },
          },
        }),
        "utf8",
      );

      const { settings } = loadRankingConfig(configPath);

      expect(settings.exclude).toEqual(["\\btest\\b"]);
      expect(settings.resolutions.r1080p).toBe(false);
      expect(settings.resolutions.r720p).toBe(false);
    });
  });

  it("loads custom ranking model values from the file", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({
          rankingModel: { webdl: 9999, remux: 5000 },
        }),
        "utf8",
      );

      const { rankingModel } = loadRankingConfig(configPath);

      expect(rankingModel.webdl).toBe(9999);
      expect(rankingModel.remux).toBe(5000);
    });
  });

  it("applies schema defaults for fields not present in the file", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(configPath, JSON.stringify({}), "utf8");

      const { settings, rankingModel } = loadRankingConfig(configPath);

      expect(settings.resolutions.r1080p).toBe(true);
      expect(rankingModel.av1).toBe(0);
    });
  });

  it("does not call warn for valid configs", async () => {
    const loggerModule = await import("../utilities/logger/logger.ts");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({ settings: { exclude: ["\\btest\\b"] } }),
        "utf8",
      );

      const warn = vi.spyOn(loggerModule.logger, "warn");

      loadRankingConfig(configPath);

      expect(warn).not.toHaveBeenCalled();
    });
  });
});

describe("when the config file contains invalid JSON", () => {
  it("throws an error with a descriptive message", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(configPath, "{ this is not valid json }", "utf8");

      expect(() => loadRankingConfig(configPath)).toThrow(/invalid JSON/i);
    });
  });

  it("includes the file path in the error message", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(configPath, "{bad}", "utf8");

      expect(() => loadRankingConfig(configPath)).toThrow(
        new RegExp(path.basename(configPath).replace(".", "\\.")),
      );
    });
  });
});

describe("when the config contains unknown keys", () => {
  it("warns about unknown top-level keys", async () => {
    const { logger } = await import("../utilities/logger/logger.ts");
    const warnSpy = vi.spyOn(logger, "warn");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({ unknownTopLevelKey: true }),
        "utf8",
      );

      loadRankingConfig(configPath);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("unknownTopLevelKey"),
      );
    });
  });

  it("warns about unknown keys nested in settings.resolutions", async () => {
    const { logger } = await import("../utilities/logger/logger.ts");
    const warnSpy = vi.spyOn(logger, "warn");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({
          settings: { resolutions: { "123p": true } },
        }),
        "utf8",
      );

      loadRankingConfig(configPath);

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("123p"));
    });
  });

  it("warns about unknown keys nested in rankingModel", async () => {
    const { logger } = await import("../utilities/logger/logger.ts");
    const warnSpy = vi.spyOn(logger, "warn");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({ rankingModel: { unknownFormat: 500 } }),
        "utf8",
      );

      loadRankingConfig(configPath);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("unknownFormat"),
      );
    });
  });

  it("still returns a valid config after warning about unknown keys", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({
          settings: {
            resolutions: { r1080p: false, "123p": true },
          },
        }),
        "utf8",
      );

      const { settings } = loadRankingConfig(configPath);

      expect(settings.resolutions.r1080p).toBe(false);
    });
  });
});

describe("when the config contains invalid values for valid keys", () => {
  it("warns about invalid values in settings", async () => {
    const { logger } = await import("../utilities/logger/logger.ts");
    const warnSpy = vi.spyOn(logger, "warn");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({
          settings: { resolutions: { r1080p: "yes" } },
        }),
        "utf8",
      );

      loadRankingConfig(configPath);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/settings.*r1080p|r1080p.*settings/i),
      );
    });
  });

  it("warns about invalid values in rankingModel", async () => {
    const { logger } = await import("../utilities/logger/logger.ts");
    const warnSpy = vi.spyOn(logger, "warn");

    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({ rankingModel: { webdl: "high" } }),
        "utf8",
      );

      loadRankingConfig(configPath);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/rankingModel.*webdl|webdl.*rankingModel/i),
      );
    });
  });

  it("falls back to defaults when settings has invalid values", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({
          settings: { resolutions: { r1080p: "yes" } },
        }),
        "utf8",
      );

      const { settings } = loadRankingConfig(configPath);

      expect(settings.resolutions.r1080p).toBe(true);
    });
  });

  it("falls back to defaults when rankingModel has invalid values", () => {
    withTempDir((dir) => {
      const configPath = path.join(dir, "ranking-config.json");

      writeFileSync(
        configPath,
        JSON.stringify({ rankingModel: { webdl: "high" } }),
        "utf8",
      );

      const { rankingModel } = loadRankingConfig(configPath);

      expect(rankingModel.webdl).toBe(1500);
    });
  });
});
