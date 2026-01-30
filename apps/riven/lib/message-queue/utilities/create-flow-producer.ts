import { logger } from "@repo/core-util-logger";
import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { FlowProducer, type QueueOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";
import z from "zod";

import packageJson from "../../../../../package.json" with { type: "json" };

FlowProducer.setMaxListeners(200);

export function createFlowProducer(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const flowProducer = new FlowProducer({
    ...options,
    connection: {
      url: z.url().parse(process.env["REDIS_URL"]),
    },
    telemetry: new BullMQOtel(
      `riven-flow-producer-${name}`,
      packageJson.version,
    ),
  });

  registerMQListeners(flowProducer);

  flowProducer.on("error", logger.error);

  return flowProducer;
}
