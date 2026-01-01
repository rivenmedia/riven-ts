import { it } from "./helpers/test-context.ts";
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
