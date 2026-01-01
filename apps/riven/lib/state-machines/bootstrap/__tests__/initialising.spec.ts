import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

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
