import { queueNameFor } from "./queue-name-for.ts";

import type { Flow } from "../flows/index.ts";
import type { SandboxedJobDefinition } from "../sandboxed-jobs/index.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

/**
 * BullMQ keys a child job's processed value / ignored-failure reason as
 * `bull:<queueName>:<childJobId>`. This builds that key so the value and
 * failure lookups share one definition of the convention.
 *
 * Called without `id` it returns the `bull:<queueName>:` prefix, used to
 * build a regex that matches every child of the queue.
 */
export function childJobKey(
  queueName: Flow["name"] | SandboxedJobDefinition["name"] | RivenEvent["type"],
  pluginName?: string,
  id?: string,
): string {
  return `bull:${queueNameFor(queueName, pluginName)}:${id ?? ""}`;
}
