import { it } from "./helpers/test-context.ts";
import { createActor, fromPromise } from "xstate";
import { expect, vi } from "vitest";

it('starts in the "Idle" state', ({ actor }) => {
  expect(actor.getSnapshot().value).toBe("Idle");
});

it('transitions to "Initialising" state on START event', ({ actor }) => {
  actor.send({ type: "START" });

  expect(actor.getSnapshot().value).toEqual({
    Initialising: {
      "Bootstrap plugins": "Registering",
      "Bootstrap GraphQL Server": "Starting",
      "Bootstrap database connection": "Starting",
    },
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

it("validates the plugins", async ({ actor }) => {
  const pluginTest = await import("@repo/plugin-test");
  const pluginValidateSpy = vi.spyOn(
    pluginTest.default.validator,
    "getInitialSnapshot",
  );

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toEqual("Running");
  });

  expect(pluginValidateSpy).toHaveBeenCalledOnce();
});

it("sets up data sources for plugins", async ({ actor }) => {
  const pluginTest = await import("@repo/plugin-test");

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toEqual("Running");
  });

  const { plugins } = actor.getSnapshot().context;

  expect(
    plugins
      .get(pluginTest.default.name)
      ?.dataSources.get(pluginTest.default.dataSources[0]),
  ).toBeDefined();
});

it("errors if the database connection fails to initialise", async ({
  machine,
}) => {
  const actor = createActor(
    machine.provide({
      actors: {
        // @ts-expect-error Testing error case
        // eslint-disable-next-line @typescript-eslint/require-await
        initialiseDatabaseConnection: fromPromise(async () => {
          throw new Error();
        }),
      },
    }),
    {
      input: {
        cache: {} as never,
        sessionId: crypto.randomUUID(),
      },
    },
  );

  actor.start();

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Errored");
  });

  actor.stop();
});

it("errors if the GraphQL server fails to start", async ({ machine }) => {
  const actor = createActor(
    machine.provide({
      actors: {
        // @ts-expect-error Testing error case
        // eslint-disable-next-line @typescript-eslint/require-await
        startGqlServer: fromPromise(async () => {
          throw new Error();
        }),
      },
    }),
    {
      input: {
        cache: {} as never,
        sessionId: crypto.randomUUID(),
      },
    },
  );

  actor.start();

  actor.send({ type: "START" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Errored");
  });

  actor.stop();
});
