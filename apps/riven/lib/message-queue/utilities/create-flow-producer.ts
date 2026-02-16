import { registerMQListeners } from "@repo/util-plugin-sdk/helpers/register-mq-listeners";

import { FlowProducer, type QueueOptions } from "bullmq";

import { logger } from "../../utilities/logger/logger.ts";
import { settings } from "../../utilities/settings.ts";
import { telemetry } from "../../utilities/telemetry.ts";

FlowProducer.setMaxListeners(200);

export function createFlowProducer(
  options?: Omit<QueueOptions, "connection" | "telemetry">,
) {
  const flowProducer = new FlowProducer({
    ...options,
    connection: {
      url: settings.redisUrl,
    },
    telemetry,
  });

  registerMQListeners(flowProducer, logger);

  return flowProducer;
}
