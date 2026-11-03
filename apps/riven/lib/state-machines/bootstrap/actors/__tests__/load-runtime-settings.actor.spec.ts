import { expect, vi } from "vitest";
import { createActor, toPromise } from "xstate";
import { ZodError } from "zod";

import { it } from "#__tests__/test-context.ts";
import { CORE_NAMESPACE } from "#settings/core-settings-sections.ts";
import { configureLogger, logger } from "#utilities/logger/logger.ts";
import { getRuntimeSettings } from "#utilities/runtime-settings.ts";

import { loadRuntimeSettings } from "../load-runtime-settings.actor.ts";

import type { Services } from "#database/database.ts";

async function runLoader(
  services: Services,
  environment: Record<string, string> = {},
) {
  await toPromise(
    createActor(loadRuntimeSettings, {
      input: { settingsService: services.settingsService, environment },
    }).start(),
  );
}

it("drops an invalid stored value, logs a warning and continues", async ({
  services,
}) => {
  await services.settingsService.writeValues(CORE_NAMESPACE, {
    upsert: { dubbedAnimeOnly: "yes" },
    delete: [],
  });

  const warnSpy = vi.spyOn(logger, "warn");

  await expect(runLoader(services)).resolves.toBeUndefined();

  expect(getRuntimeSettings().general.scraping.dubbedAnimeOnly).toBe(false);
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining("dubbedAnimeOnly"),
    expect.objectContaining({
      namespace: CORE_NAMESPACE,
      key: "dubbedAnimeOnly",
    }),
  );
});

it("applies a valid stored value", async ({ services }) => {
  await services.settingsService.writeValues(CORE_NAMESPACE, {
    upsert: { dubbedAnimeOnly: true },
    delete: [],
  });

  await runLoader(services);

  expect(getRuntimeSettings().general.scraping.dubbedAnimeOnly).toBe(true);
});

it("prefers the environment value over the stored value", async ({
  services,
}) => {
  await services.settingsService.writeValues(CORE_NAMESPACE, {
    upsert: { dubbedAnimeOnly: true },
    delete: [],
  });

  await runLoader(services, { dubbedAnimeOnly: "false" });

  expect(getRuntimeSettings().general.scraping.dubbedAnimeOnly).toBe(false);
});

it("loads the plugins section from stored values", async ({ services }) => {
  await services.settingsService.writeValues(CORE_NAMESPACE, {
    upsert: { enabledPlugins: ["test"] },
    delete: [],
  });

  await runLoader(services);

  expect(getRuntimeSettings().plugins.enabledPlugins).toStrictEqual(["test"]);
});

it("reconfigures the logger from the loaded settings", async ({
  services,
  onTestFinished,
}) => {
  const previousLogging = getRuntimeSettings().general.logging;

  onTestFinished(() => {
    configureLogger(previousLogging);
  });

  await services.settingsService.writeValues(CORE_NAMESPACE, {
    upsert: { logLevel: "warn" },
    delete: [],
  });

  await runLoader(services);

  expect(logger.level).toBe("warn");
});

it("rejects when an environment value is invalid", async ({ services }) => {
  await expect(
    runLoader(services, { dubbedAnimeOnly: "yes" }),
  ).rejects.toBeInstanceOf(ZodError);
});
