import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

it("starts the plugin runners when the main runner starts", async ({
  actor,
}) => {
  const testPlugin = await import("@repo/plugin-test");
  const pluginHookSpy = vi.spyOn(
    testPlugin.default.hooks,
    "riven.core.started",
  );

  actor.start();

  expect(pluginHookSpy).toHaveBeenCalledOnce();
});
