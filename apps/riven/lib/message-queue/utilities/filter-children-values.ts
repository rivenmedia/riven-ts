import { queueNameFor } from "./queue-name-for.ts";

import type { Flow } from "../flows/index.ts";
import type { SandboxedJobDefinition } from "../sandboxed-jobs/index.ts";

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
  return Object.fromEntries(
    Object.entries(childrenValues).filter(([key]) =>
      key.includes(queueNameFor(queueName)),
    ),
  );
}
