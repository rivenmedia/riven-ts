import { Flow } from "../flows/index.js";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export function queueNameFor<T extends Flow["name"]>(eventName: T): T;

export function queueNameFor<T extends RivenEvent["type"], P extends string>(
  eventName: T,
  pluginName: P,
): `${T}.plugin-${P}`;

export function queueNameFor(
  eventName: RivenEvent["type"] | Flow["name"],
  pluginName?: string,
): string {
  if (pluginName === undefined) {
    return eventName;
  }

  return `${eventName}.plugin-${pluginName}`;
}
