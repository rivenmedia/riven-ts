import assert from "node:assert";

import { eventSerialiserSchemaMap } from "../../utilities/serialisers/event-serialiser-schemas.ts";
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
): FlowChildJob => {
  const [eventType] = schema.shape.type.def.values;

  assert(eventType);

  const serialiser = eventSerialiserSchemaMap.get(eventType);

  assert(serialiser, `No event serialiser found for event type: ${eventType}`);

  return {
    name: `${pluginName} - ${jobName}`,
    queueName: queueNameFor(eventType, pluginName),
    data: serialiser.omit({ type: true }).encode(data),
    opts,
  };
};
