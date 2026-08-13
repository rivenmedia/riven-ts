import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { AppModule } from "./app.module.ts";
import { RIVEN_CACHE } from "./cache/cache.module.ts";
import { RIVEN_LOGGER } from "./logging/logging.module.ts";
import { RIVEN_SETTINGS } from "./settings/settings.module.ts";
import { logger } from "./utilities/logger/logger.ts";
import { redisCache } from "./utilities/redis-cache.ts";
import { settings } from "./utilities/settings.ts";

import type { TestingModule } from "@nestjs/testing";

async function createTestingModule() {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  return module;
}

describe("the application module", () => {
  it("compiles", async () => {
    const module = await createTestingModule();

    await expect(module.close()).resolves.not.toThrow();
  });

  // These infrastructure singletons hold live resources - the logger owns
  // rotating file transports and symlinks, the cache owns a Redis connection.
  // Resolving a distinct instance through DI would duplicate those resources,
  // so identity is asserted rather than mere availability.

  it.for([
    ["settings", RIVEN_SETTINGS, settings],
    ["logger", RIVEN_LOGGER, logger],
    ["cache", RIVEN_CACHE, redisCache],
  ] as const)(
    "provides the existing %s singleton",
    async ([, token, expected]) => {
      const module = await createTestingModule();

      expect(module.get(token)).toBe(expected);

      await module.close();
    },
  );
});
