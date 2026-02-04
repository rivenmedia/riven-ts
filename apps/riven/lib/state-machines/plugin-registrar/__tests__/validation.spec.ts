import * as testPlugin from "@repo/plugin-test";

import { expect, vi } from "vitest";
import { toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

vi.mock(import("node:timers/promises"), async (importOriginal) => {
  const originalModule = await importOriginal();

  return {
    ...originalModule,
    setTimeout: vi.fn(),
  };
});

it('validates the plugin on "riven.validate-plugin" event', async ({
  actor,
}) => {
  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toBe("Validated");
  });

  expect(actor.getSnapshot().context.validPlugins.size).toBe(1);
});

it("retries validation up to 3 times on failure", async ({ actor }) => {
  const validatePluginSpy = vi
    .spyOn(testPlugin.default, "validator")
    .mockResolvedValue(false);

  await vi.waitFor(() => {
    expect(validatePluginSpy).toHaveBeenCalledTimes(3);
  });

  expect(actor.getSnapshot().value).toBe("Validated");
  expect(actor.getSnapshot().context.invalidPlugins.size).toBe(1);
});

it("returns the validated plugins", async ({ actor }) => {
  const result = await toPromise(actor);

  expect(result.validPlugins.size).toBe(1);
  expect(result.invalidPlugins.size).toBe(0);
});
