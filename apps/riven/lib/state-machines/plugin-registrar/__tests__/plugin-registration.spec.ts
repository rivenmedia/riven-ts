import { expect } from "vitest";
import { toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it("instantiates plugin datasources", async ({ actor }) => {
  const testPlugin = await import("@repo/plugin-test");

  await toPromise(actor.start());

  const registeredPlugin = actor
    .getSnapshot()
    .context.validPlugins.get(Symbol.for("Test"));

  expect(registeredPlugin).toBeDefined();

  const dataSource = testPlugin.default.dataSources[0];

  expect(registeredPlugin?.dataSources.get(dataSource)).toBeInstanceOf(
    dataSource,
  );

  const dataSourceInstance = registeredPlugin?.dataSources.get(dataSource);

  expect(dataSourceInstance?.token).toBe("TEST_API_TOKEN");
});
