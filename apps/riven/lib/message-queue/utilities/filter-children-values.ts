import { queueNameFor } from "./queue-name-for.ts";

import type { Flow } from "../flows/index.ts";
import type { SandboxedJobDefinition } from "../sandboxed-jobs/index.ts";

/**
 * BullMQ returns children values in a flat object with keys in the format of `${queueName}:${childJobId}`.
 *
 * This function filters those values to only include those whose keys include the provided queue name.
 *
 * @param childrenValues Values returned from `await job.getChildrenValues()`
 * @param queueName The queue name to search for
 * @returns Children values whose queue name matches the name provided
 *
 * @example
 *
 * ```ts
 * const childrenValues = await job.getChildrenValues();
 *
 * // {
 * //   "bullmq:download-item.find-valid-torrent:123": { ... },
 * //   "bullmq:download-item.find-valid-torrent:456": { ... },
 * //   "bullmq:some-other-queue:789": { ... },
 * // }
 *
 * const filteredValues = filterChildrenValues(childrenValues, "download-item.find-valid-torrent");
 *
 * // {
 * //   "bullmq:download-item.find-valid-torrent:123": { ... },
 * //   "bullmq:download-item.find-valid-torrent:456": { ... },
 * // }
 * ```
 */
export function filterChildrenValues<
  T extends SandboxedJobDefinition["name"] | Flow["name"],
>(
  childrenValues: Record<string, unknown>,
  queueName: T,
): Record<
  string,
  Extract<SandboxedJobDefinition | Flow, { name: T }>["output"]
>;

export function filterChildrenValues(
  childrenValues: Record<string, unknown>,
  queueName: Flow["name"] | SandboxedJobDefinition["name"],
): Record<string, unknown>;

export function filterChildrenValues(
  childrenValues: Record<string, unknown>,
  queueName: Flow["name"] | SandboxedJobDefinition["name"],
): Record<string, unknown> {
  const pattern = new RegExp(`bull:${queueNameFor(queueName)}:[\\w-$]+$`);

  return Object.fromEntries(
    Object.entries(childrenValues).filter(([key]) => pattern.test(key)),
  );
}
