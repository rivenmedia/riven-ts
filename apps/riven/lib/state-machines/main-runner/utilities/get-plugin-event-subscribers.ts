import type { RegisteredPluginMap } from "../../../types/plugins.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export function getPluginEventSubscribers(
  event: RivenEvent["type"],
  pluginMap: RegisteredPluginMap,
) {
  return Array.from(
    pluginMap
      .values()
      .map((plugin) => plugin.config)
      .filter(({ hooks }) => hooks[event]),
  );
}
