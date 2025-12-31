import { it } from "./helpers/test-context.ts";
import { CHECK_SERVER_STATUS } from "../actors/check-server-status.actor.ts";
import { CHECK_PLUGIN_STATUSES } from "../actors/check-plugin-statuses.actor.ts";
import { expect, vi } from "vitest";
import { graphql, HttpResponse } from "msw";

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
      "Bootstrap plugins": "Registering",
    },
  });
});

it.skip('transitions to the "Errored" state if the plugins are unhealthy', async ({
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

it('starts the plugin runners when entering the "Running" state', async ({
  actor,
}) => {
  const pluginTest = await import("@repo/plugin-test");
  const pluginHookSpy = vi.spyOn(pluginTest.default.runner, "start");

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toEqual("Running");
  });

  expect(pluginHookSpy).toHaveBeenCalledOnce();
});
