import { expect, vi } from "vitest";
import { toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it('validates the plugin on "riven.validate-plugin" event', async ({
  actor,
}) => {
  actor.start();

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Validated");
  });

  expect(actor.getSnapshot().context.validPlugins.size).toBe(1);
});

it("retries validation up to 3 times on failure", async ({ actor }) => {
  vi.useFakeTimers();

  const testPlugin = await import("@repo/plugin-test");

  const validatePluginSpy = vi
    .spyOn(testPlugin.default, "validator")
    .mockReturnValue(false as never);

  actor.start();

  for (let i = 0; i < 2; i++) {
    await vi.waitFor(() => {
      expect(validatePluginSpy).toHaveBeenCalledTimes(i + 1);
    });

    vi.runOnlyPendingTimers();
  }

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Validated");
  });

  expect(actor.getSnapshot().context.invalidPlugins.size).toBe(1);
});

it("returns the validated plugins", async ({ actor }) => {
  const result = await toPromise(actor);

  expect(result.validPlugins.size).toBe(1);
  expect(result.invalidPlugins.size).toBe(0);
});
