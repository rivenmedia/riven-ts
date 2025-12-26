import { it } from "./helpers/test-context.ts";
import { CHECK_SERVER_STATUS } from "../actors/check-server-status.actor.ts";
import { CHECK_PLUGIN_STATUSES } from "../actors/check-plugin-statuses.actor.ts";
import { ApolloClient } from "@apollo/client";
import { expect } from "vitest";
import { graphql, HttpResponse } from "msw";
import { waitFor } from "xstate";

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
      "Check plugin status": "Checking",
      "Check server status": "Checking",
    },
  });
});

it("initialises the Apollo Client in context", ({ actor }) => {
  const { context } = actor.getSnapshot();

  expect(context.client).toBeInstanceOf(ApolloClient);
});

it('transitions to "Exited" state on EXIT event', ({ actor }) => {
  actor.send({ type: "EXIT" });

  expect(actor.getSnapshot().value).toBe("Exited");
});

it('transitions to the "Running" state if the plugins and server are healthy', async ({
  actor,
}) => {
  actor.send({ type: "START" });

  await waitFor(actor, (snapshot) => snapshot.value === "Running");
});

it('transitions to the "Errored" state if the server is unhealthy', async ({
  actor,
  server,
}) => {
  server.use(
    graphql.query(CHECK_SERVER_STATUS, () => HttpResponse.error()),
    graphql.query(CHECK_PLUGIN_STATUSES, () =>
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
  );

  actor.send({ type: "START" });

  await waitFor(actor, (snapshot) => snapshot.value === "Errored");
});

it('transitions to the "Errored" state if the plugins are unhealthy', async ({
  actor,
  server,
}) => {
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
        errors: [
          {
            message: "Plugins are unhealthy",
          },
        ],
      }),
    ),
  );

  actor.send({ type: "START" });

  await waitFor(actor, (snapshot) => snapshot.value === "Errored");
});
