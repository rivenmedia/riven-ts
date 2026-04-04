import assert from "node:assert";

import { serialiseEventData } from "../../utilities/serialisers/serialise-event-data.ts";
import { queueNameFor } from "./queue-name-for.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { Type } from "arktype";
import type { FlowChildJob, JobsOptions } from "bullmq";

export const createPluginFlowJob = <
  T extends Type<{
    type: RivenEvent["type"];
  }>,
>(
  schema: T,
  jobName: string,
  pluginName: string,
  data: ParamsFor<T["infer"]>,
  opts: Partial<Omit<JobsOptions, "name" | "queueName" | "data">> = {},
  children: FlowChildJob[] = [],
): FlowChildJob => {
  const eventType = schema.get("type");

  assert(eventType);

  return {
    name: `${pluginName} - ${jobName}`,
    queueName: queueNameFor(eventType, pluginName),
    data: serialiseEventData(eventType, data),
    opts,
    children,
  };
};
