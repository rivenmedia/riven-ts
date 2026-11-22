// oxlint-disable sonarjs/no-clear-text-protocols -- the control router listens on loopback, and `.invalid` URLs never resolve
import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import express from "express";
import { http } from "msw/http";
import { passthrough } from "msw/utils/passthrough";
import assert from "node:assert";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, onTestFinished, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { server as mockServer } from "#mocks/node.ts";
import { deadStreamLinkScenario } from "#mocks/scenarios/dead-stream-link.scenario.ts";
import { unhandledRequests } from "#mocks/utilities/unhandled-requests.ts";
import { SettingsManager } from "#settings/settings-manager.ts";
import { buildSettingsSections } from "#settings/settings-sections.ts";

import { createE2eControlClient } from "../control-client.ts";
import { createE2eControlRouter } from "../control-router.ts";

import type { MockScenarioName } from "../scenario-names.ts";
import type { EntityManager } from "@mikro-orm/core";

// `node.ts` refuses to load outside of a mock scenario, so stand in for its handler facade.
vi.mock(import("#mocks/node.ts"), () => ({
  server: {
    use: () => undefined,
    resetHandlers: () => undefined,
    close: () => undefined,
  },
}));

// Test mode can't apply `dead-stream-link`, as it sets environment data, so
// `e2e-baseline` stands in for a scenario that seeds its movie and handlers.
vi.mock(import("#mocks/scenarios/index.ts"), async (importOriginal) => {
  const { scenarios } = await importOriginal();
  const { MockScenario } = await import("#mocks/utilities/mock-scenario.ts");
  const { deadStreamLinkScenario: deadStreamLink } =
    await import("#mocks/scenarios/dead-stream-link.scenario.ts");

  class TestScenario extends MockScenario {
    public override scenarioName = "e2e-baseline" as const;

    public override handlers = deadStreamLink.handlers;

    public override async seed(em: EntityManager) {
      await deadStreamLink.seed(em);
    }
  }

  return { scenarios: { ...scenarios, "e2e-baseline": new TestScenario() } };
});

const apiKey = "e2e-control-router-test-api-key-0123456789";

const it = baseIt
  // Keeps the legacy ranking config import away from any file in the working directory.
  .extend("emptyWorkingDirectory", async ({}, { onCleanup }) => {
    const dir = await mkdtemp(path.join(tmpdir(), "riven-e2e-control-"));

    vi.spyOn(process, "cwd").mockReturnValue(dir);

    onCleanup(async () => {
      await rm(dir, { recursive: true });
    });

    return dir;
  })
  .extend(
    "settingsManager",
    ({ services }) =>
      new SettingsManager({
        settingsService: services.settingsService,
        sections: buildSettingsSections({
          installedPlugins: [],
          pluginEnvironment: new Map(),
          coreEnvironment: {},
          rankingProfileService: services.rankingProfileService,
          settingsService: services.settingsService,
        }),
        installedPlugins: [],
        coreEnvironment: {},
      }),
  )
  .extend(
    "rivenUrl",
    async (
      { emptyWorkingDirectory: _, orm, server, services, settingsManager },
      { onCleanup },
    ) => {
      const app = express();

      app.disable("x-powered-by");
      app.use(
        "/__e2e__",
        express.json(),
        createE2eControlRouter({ orm, services, settingsManager, apiKey }),
      );

      const httpServer = app.listen(0, "127.0.0.1");

      await once(httpServer, "listening");

      onCleanup(async () => {
        await new Promise<void>((resolve, reject) => {
          httpServer.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      });

      const address = httpServer.address();

      assert.ok(address !== null && typeof address === "object");

      const url = new URL(`http://127.0.0.1:${address.port.toString()}/`);

      server.use(http.all(`${url.origin}/*`, () => passthrough()));

      return url;
    },
  )
  .extend("controlClient", ({ rivenUrl }) =>
    createE2eControlClient(rivenUrl, apiKey),
  )
  .extend("resetHandlersSpy", () => vi.spyOn(mockServer, "resetHandlers"));

async function postScenario(
  rivenUrl: URL,
  scenario: string,
  headers: Record<string, string> = {},
) {
  return fetch(new URL("/__e2e__/scenario", rivenUrl), {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ scenario }),
  });
}

it("rejects requests without the API key", async ({ rivenUrl }) => {
  const response = await postScenario(rivenUrl, "dead-stream-link");

  expect(response.status).toBe(401);
});

it("rejects requests with the wrong API key", async ({ rivenUrl }) => {
  const response = await postScenario(rivenUrl, "dead-stream-link", {
    authorization: `Bearer ${apiKey}-wrong`,
  });

  expect(response.status).toBe(401);
});

it("rejects unknown scenarios", async ({ rivenUrl }) => {
  const response = await postScenario(rivenUrl, "nope", {
    authorization: `Bearer ${apiKey}`,
  });

  expect(response.status).toBe(400);
});

it("rejects scenarios that set environment data", async ({ rivenUrl }) => {
  const response = await postScenario(rivenUrl, "dead-stream-link", {
    authorization: `Bearer ${apiKey}`,
  });

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toStrictEqual({
    error:
      'Mock scenario "dead-stream-link" sets environment data, which test mode can\'t apply',
  });
});

it("throws the status and body of a failed control request", async ({
  controlClient,
}) => {
  await expect(
    controlClient.applyScenario("nope" as MockScenarioName),
  ).rejects.toThrow(/400.*nope/u);
});

it("resets the instance and applies the scenario", async ({
  controlClient,
  factories,
  orm,
  settingsManager,
}) => {
  const movie = await factories.movieFactory.createOne();

  await settingsManager.updateSection("general", {
    scraping: { dubbedAnimeOnly: true },
  });

  expect(settingsManager.restartRequired).toBe(true);

  await expect(
    controlClient.applyScenario("e2e-baseline"),
  ).resolves.toBeUndefined();

  const em = orm.em.fork();

  await expect(em.findOne(Movie, movie.id)).resolves.toBeNull();
  await expect(
    em.findOne(Movie, { title: "Dead Stream Movie" }),
  ).resolves.not.toBeNull();
  expect(settingsManager.restartRequired).toBe(false);
});

it("resets the mock handlers to the scenario's", async ({
  controlClient,
  resetHandlersSpy,
}) => {
  await controlClient.applyScenario("e2e-baseline");

  expect(resetHandlersSpy).toHaveBeenCalledExactlyOnceWith(
    ...deadStreamLinkScenario.handlers,
  );
});

it("reports and clears unhandled requests", async ({ controlClient }) => {
  onTestFinished(() => {
    unhandledRequests.clear();
  });

  unhandledRequests.record({ method: "GET", url: "http://x.invalid/" });

  await expect(controlClient.getUnhandledRequests()).resolves.toStrictEqual([
    { method: "GET", url: "http://x.invalid/" },
  ]);

  await controlClient.applyScenario("e2e-baseline");

  await expect(controlClient.getUnhandledRequests()).resolves.toStrictEqual([]);
});
