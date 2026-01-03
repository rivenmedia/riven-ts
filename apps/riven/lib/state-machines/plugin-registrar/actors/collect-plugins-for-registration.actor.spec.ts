import { expect, it } from "vitest";
import { createActor, toPromise } from "xstate";

import { collectPluginsForRegistration } from "./collect-plugins-for-registration.actor.ts";

it("returns the installed plugins from the package.json file", async () => {
  const actor = createActor(collectPluginsForRegistration);
  const testPlugin = await import("@repo/plugin-test");

  const plugins = await toPromise(actor.start());

  expect(plugins).toEqual({
    invalidPlugins: [],
    unresolvablePlugins: [],
    validPlugins: [testPlugin.default],
  });
});
