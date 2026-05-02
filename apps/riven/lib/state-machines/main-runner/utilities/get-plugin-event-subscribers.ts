import type { RegisteredPluginMap } from "../../../types/plugins.ts";
import type { RivenEvent } from "@rivenmedia/plugin-sdk/events";

export function getPluginEventSubscribers(
  event: RivenEvent["type"],
  pluginMap: RegisteredPluginMap,
) {
  return [...pluginMap.values()]
    .map((plugin) => plugin.config)
    .filter(({ hooks }) => hooks[event]);
}
