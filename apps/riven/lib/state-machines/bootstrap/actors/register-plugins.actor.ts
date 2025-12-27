import "reflect-metadata";

import packageJson from "../../../../package.json" with { type: "json" };
import { fromPromise } from "xstate";
import {
  SubscribableProgramEvent,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

export const registerPlugins = fromPromise(async ({ self }) => {
  const plugins = await parsePluginsFromDependencies(
    packageJson.dependencies,
    import.meta.resolve.bind(null),
  );

  for (const plugin of plugins) {
    for (const event of SubscribableProgramEvent.options) {
      if (plugin.events?.[event]) {
        self._parent?.on(event, plugin.events[event]);
      }
    }
  }
});
