import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { FlowProducer, type QueueOptions } from "bullmq";
import { BullMQOtel } from "bullmq-otel";

import packageJson from "../../../../../package.json" with { type: "json" };
import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";

FlowProducer.setMaxListeners(200);

export function createFlowProducer(
  name: string,
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const flowProducer = new FlowProducer({
    ...options,
    connection: {
      url: settings.redisUrl,
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
