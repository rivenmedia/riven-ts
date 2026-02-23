import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import {
  FlowProducer,
  type Job,
  type JobNode,
  type JobsOptions,
  type PluginJobNode,
  type QueueOptions,
} from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createPluginFlowJob } from "./create-flow-plugin-job.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { ZodLiteral, ZodObject, ZodType, z } from "zod";

FlowProducer.setMaxListeners(200);

declare module "bullmq" {
  interface PluginJobNode<
    D = unknown,
    R = unknown,
    N extends string = string,
  > extends Pick<JobNode, "children"> {
    job: Job<D, R, N>;
  }
}

export class ExtendedFlowProducer extends FlowProducer {
  addPluginJob<
    I extends ZodObject<{
      type: ZodLiteral<RivenEvent["type"]>;
    }>,
    O extends ZodType,
  >(
    inputSchema: I,
    _outputSchema: O,
    jobName: string,
    pluginName: string,
    data: ParamsFor<z.input<I>>,
    opts: Partial<Omit<JobsOptions, "name" | "queueName" | "data">>,
  ): Promise<PluginJobNode<ParamsFor<z.input<I>>, z.infer<O>>> {
    const job = createPluginFlowJob(
      inputSchema,
      jobName,
      pluginName,
      data,
      opts,
    );

    return this.add(job);
  }
}

export function createFlowProducer(
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const flowProducer = new ExtendedFlowProducer({
    ...options,
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  registerMQListeners(flowProducer, logger);

  return flowProducer;
}
