import type { ValidPluginMap } from "../../../types/plugins.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export function getPluginEventSubscribers(
  event: RivenEvent["type"],
  pluginMap: ValidPluginMap,
) {
  return pluginMap
    .values()
    .map((plugin) => plugin.config)
    .filter(({ hooks }) => hooks[event])
    .toArray();
}
