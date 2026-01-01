import { expect, vi } from "vitest";
import { createActor, fromCallback, fromPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it('starts in the "Idle" state', ({ actor }) => {
  expect(actor.getSnapshot().value).toBe("Idle");
});

it('validates the plugin on "riven:validate-plugin" event', async ({
  machine,
  input,
}) => {
  const validatePluginSpy = vi.fn().mockResolvedValue(true);

  const actor = createActor(
    machine.provide({
      actors: {
        validatePlugin: fromPromise(validatePluginSpy),
      },
    }),
    { input },
  );

  actor.start();

  actor.send({ type: "riven:validate-plugin" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Validating");
  });

  expect(validatePluginSpy).toHaveBeenCalledOnce();

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Validated");
  });
});

it("retries validation up to 3 times on failure", async ({
  machine,
  input,
}) => {
  vi.useFakeTimers();

  const validatePluginSpy = vi
    .fn()
    .mockRejectedValue(new Error("Validation failed"));

  const actor = createActor(
    machine.provide({
      actors: {
        validatePlugin: fromPromise(validatePluginSpy),
      },
    }),
    { input },
  );

  actor.start();

  actor.send({ type: "riven:validate-plugin" });

  for (let i = 0; i < 2; i++) {
    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Validating");
    });

    expect(validatePluginSpy).toHaveBeenCalledTimes(i + 1);

    await vi.waitFor(() => {
      expect(actor.getSnapshot().value).toBe("Validation error");
    });

    vi.advanceTimersByTime(5000);
  }

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Errored");
  });
});

it('starts the plugin runner on the "riven.started" event if the plugin is valid', async ({
  machine,
  input,
}) => {
  const pluginRunnerSpy = vi.fn().mockResolvedValue(undefined);

  const actor = createActor(
    machine.provide({
      actors: {
        validatePlugin: fromPromise(vi.fn().mockReturnValue(true)),
        pluginRunner: fromCallback(pluginRunnerSpy),
      },
    }),
    { input },
  );

  actor.start();

  actor.send({ type: "riven:validate-plugin" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Validated");
  });

  actor.send({ type: "riven.started" });

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Running");
  });

  expect(pluginRunnerSpy).toHaveBeenCalledOnce();
});
