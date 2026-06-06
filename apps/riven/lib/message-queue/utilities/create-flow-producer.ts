import {
  type FlowChildJob,
  FlowProducer,
  type Job,
  type JobNode,
  type JobsOptions,
  type NodeOpts,
  type PluginJobNode,
  type QueueBaseOptions,
  type TypedJobNode,
} from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";
import { createPluginFlowJob } from "./create-flow-plugin-job.ts";

import type { Flow } from "../flows/index.ts";
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

  interface TypedJobNode<D = unknown, R = unknown> extends JobNode {
    job: Job<D, R>;
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
    opts: Partial<Omit<JobsOptions, "name" | "queueName" | "data">> = {},
    children?: FlowChildJob[],
  ): Promise<PluginJobNode<ParamsFor<z.input<I>>, z.infer<O>>> {
    const job = createPluginFlowJob(
      inputSchema,
      jobName,
      pluginName,
      data,
      opts,
      children,
    );

    return this.add(job);
  }

  override getFlow<T extends Flow>(
    opts: NodeOpts,
  ): Promise<TypedJobNode<T["input"], T["output"]>> {
    return super.getFlow(opts);
  }
}

export function createFlowProducer(
  options?: Omit<QueueBaseOptions, "connection" | "telemetry">,
): ExtendedFlowProducer {
  const flowProducer = new ExtendedFlowProducer({
    ...options,
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  flowProducer.on("error", (error) => {
    logger.error(`FlowProducer error`, { err: error });
  });

  return flowProducer;
}
