import { expect } from "vitest";
import { toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

it.skip("instantiates plugin datasources", async ({ actor }) => {
  const testPlugin = await import("@repo/plugin-test");

  await toPromise(actor.start());

  const registeredPlugin = actor
    .getSnapshot()
    .context.validPlugins.get(Symbol.for("@repo/plugin-test"));

  expect(registeredPlugin).toBeDefined();

  const DataSourceConstructor = testPlugin.default.dataSources?.[0];

  expect.assert(DataSourceConstructor);

  const dataSourceInstance = registeredPlugin?.dataSources.get(
    DataSourceConstructor,
  );

  expect(dataSourceInstance).toBeInstanceOf(DataSourceConstructor);
});
