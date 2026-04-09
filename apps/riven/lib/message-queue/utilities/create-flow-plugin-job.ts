import assert from "node:assert";

import { serialiseEventData } from "../../utilities/serialisers/serialise-event-data.ts";
import { queueNameFor } from "./queue-name-for.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { FlowChildJob, JobsOptions } from "bullmq";
import type { ZodLiteral, ZodObject, z } from "zod";

export const createPluginFlowJob = <
  T extends ZodObject<{
    type: ZodLiteral<RivenEvent["type"]>;
  }>,
>(
  schema: T,
  jobName: string,
  pluginName: string,
  data: ParamsFor<z.input<T>>,
  opts: Partial<Omit<JobsOptions, "name" | "queueName" | "data">> = {},
  children: FlowChildJob[] = [],
): FlowChildJob => {
  const [eventType] = schema.shape.type.def.values;

  assert(eventType);

  return {
    name: `${pluginName} - ${jobName}`,
    queueName: queueNameFor(eventType, pluginName),
    data: serialiseEventData(eventType, data),
    opts,
    children,
  };
};
