import { http } from "msw/http";
import { passthrough } from "msw/utils/passthrough";
import { expect, vi } from "vitest";
import { createActor, createEmptyActor, toPromise } from "xstate";

import { it as baseIt } from "#__tests__/test-context.ts";
import { settings } from "#utilities/settings.ts";

import { startGqlServer } from "./start-gql-server.actor.ts";

import type { AnyActorRef } from "xstate";

vi.hoisted(() => {
  process.env["RIVEN_SETTING__port"] = "0";
});

// `node.ts` refuses to load outside of a mock scenario, so stand in for its handler facade.
vi.mock(import("#mocks/node.ts"), () => ({
  server: {
    use: () => undefined,
    resetHandlers: () => undefined,
    close: () => undefined,
  },
}));

const it = baseIt.extend(
  "startServer",
  ({ orm, server }, { onCleanup }) =>
    async (mockScenario: string) => {
      vi.stubEnv("MOCK_SCENARIO", mockScenario);

      const mainRunnerRef: AnyActorRef = createEmptyActor();
      const { server: apolloServer, url } = await toPromise(
        createActor(startGqlServer, {
          input: {
            orm,
            mainRunnerRef,
            validPlugins: new Map(),
            installedPlugins: [],
            pluginEnvironment: new Map(),
          },
        }).start(),
      );

      onCleanup(async () => {
        vi.unstubAllEnvs();
        await apolloServer.stop();
      });

      const { origin } = new URL(url);

      server.use(http.all(`${origin}/*`, () => passthrough()));

      return new URL("/__e2e__/unhandled-requests", origin);
    },
);

it("does not mount the E2E control router outside of test mode", async ({
  startServer,
}) => {
  const response = await fetch(await startServer(""), {
    headers: { authorization: `Bearer ${settings.apiKey}` },
  });

  expect(response.status).toBe(404);
});

it("mounts the E2E control router in test mode", async ({ startServer }) => {
  const response = await fetch(await startServer("e2e-baseline"), {
    headers: { authorization: `Bearer ${settings.apiKey}` },
  });

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toStrictEqual({ requests: [] });
});
