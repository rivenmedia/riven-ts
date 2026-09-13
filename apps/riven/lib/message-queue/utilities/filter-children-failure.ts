import { childJobKey } from "./child-job-key.ts";

import type { Flow } from "../flows/index.ts";
import type { SandboxedJobDefinition } from "../sandboxed-jobs/index.ts";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

/**
 * When a child job is enqueued with `ignoreDependencyOnFailure`, a failure is
 * not surfaced through `getChildrenValues()` — the parent only sees successful
 * children. Instead, the failure reason is recorded via
 * `getIgnoredChildrenFailures()`, keyed by `bull:<queueName>:<jobId>`.
 *
 * This helper looks up the ignored-failure reason for a specific child job,
 * reusing {@link childJobKey} so it shares the exact-match key convention with
 * {@link filterChildrenValues}.
 *
 * @param ignoredChildrenFailures Values returned from `await job.getIgnoredChildrenFailures()`
 * @param queueName The event/queue name of the child job
 * @param pluginName The plugin name the child job ran under, if any
 * @param id The child job id
 * @returns The failure reason string if the child was ignored due to failure, otherwise `undefined`
 */
export function filterChildrenFailure(
  ignoredChildrenFailures: Record<string, string>,
  queueName: Flow["name"] | SandboxedJobDefinition["name"] | RivenEvent["type"],
  pluginName?: string,
  id?: string,
): string | undefined {
  return ignoredChildrenFailures[childJobKey(queueName, pluginName, id)];
}
