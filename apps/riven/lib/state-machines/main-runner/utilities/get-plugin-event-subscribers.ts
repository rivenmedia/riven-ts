import type { RegisteredPlugin } from "../../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export function getPluginEventSubscribers(
  event: RivenEvent["type"],
  pluginMap: Map<symbol, RegisteredPlugin>,
) {
  return Array.from(
    pluginMap
      .values()
      .map((plugin) => plugin.config)
      .filter(({ hooks }) => hooks[event]),
  );
}
