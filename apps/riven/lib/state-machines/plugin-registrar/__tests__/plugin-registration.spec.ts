import { expect, vi } from "vitest";

import { it } from "./helpers/test-context.ts";

it("instantiates plugin datasources", async ({ actor }) => {
  const testPlugin = await import("@repo/plugin-test");

  vi.spyOn(testPlugin.default.dataSources[0], "getApiToken").mockReturnValue(
    "TEST_API_TOKEN",
  );

  actor.start();

  await vi.waitFor(() => {
    expect(actor.getSnapshot().value).toEqual("Validated");
  });

  const registeredPlugin = actor
    .getSnapshot()
    .context.validPlugins.get(Symbol.for("Plugin: Test"));

  expect(registeredPlugin).toBeDefined();

  const dataSource = testPlugin.default.dataSources[0];

  expect(registeredPlugin?.dataSources.get(dataSource)).toBeInstanceOf(
    dataSource,
  );

  const dataSourceInstance = registeredPlugin?.dataSources.get(dataSource);

  expect(dataSourceInstance?.token).toBe("TEST_API_TOKEN");
});
