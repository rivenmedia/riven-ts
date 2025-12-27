import { it } from "./helpers/test-context.ts";
import { CHECK_SERVER_STATUS } from "../actors/check-server-status.actor.ts";
import { CHECK_PLUGIN_STATUSES } from "../actors/check-plugin-statuses.actor.ts";
import { expect, vi } from "vitest";
import { graphql, HttpResponse } from "msw";
import { SubscribableProgramEvent } from "@repo/util-plugin-sdk";

it.beforeEach(({ server }) => {
  server.use(
    graphql.query(CHECK_SERVER_STATUS, () =>
      HttpResponse.json({
        data: {
          settings: {
            __typename: "Settings",
            riven: {
              __typename: "RivenSettings",
              version: "1.0.0",
            },
          },
        },
      }),
    ),
    graphql.query(CHECK_PLUGIN_STATUSES, () =>
      HttpResponse.json({
        data: {
          settings: {
            __typename: "Settings",
            riven: {
              __typename: "RivenSettings",
              version: "1.0.0",
              apiKey: "1234",
            },
          },
        },
      }),
    ),
  );
});

it('starts in the "Idle" state', ({ actor }) => {
  expect(actor.getSnapshot().value).toBe("Idle");
});

it('transitions to "Initialising" state on START event', ({ actor }) => {
  actor.send({ type: "START" });

  expect(actor.getSnapshot().value).toEqual({
    Initialising: {
      "Check server status": "Checking",
      "Register plugins": "Registering",
    },
  });
});

it('transitions to the "Running" state if the plugins and server are healthy', async ({
  actor,
}) => {
  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Running");
  });
});

it('transitions to the "Errored" state if the server is unhealthy', async ({
  actor,
  server,
}) => {
  server.use(graphql.query(CHECK_SERVER_STATUS, () => HttpResponse.error()));

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Errored");
  });
});

it('transitions to the "Errored" state if the plugins are unhealthy', async ({
  actor,
  server,
}) => {
  server.use(
    graphql.query(CHECK_PLUGIN_STATUSES, () =>
      HttpResponse.json({
        errors: [
          {
            message: "Plugins are unhealthy",
          },
        ],
      }),
    ),
  );

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Errored");
  });
});

it(`emits the "${SubscribableProgramEvent.enum["riven.running"]}" event when entering the "Running" state`, async ({
  actor,
}) => {
  const pluginTest = await import("@repo/plugin-test");
  const pluginHookSpy = vi.spyOn(pluginTest.default.events, "riven.running");

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toEqual("Running");
  });

  expect(pluginHookSpy).toHaveBeenCalledOnce();
});
