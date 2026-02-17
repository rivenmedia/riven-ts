import type { FlowProducer, Queue, QueueEvents, Worker } from "bullmq";
import type EventEmitter from "node:events";
import type { Logger } from "winston";

async function shutdownHandler(
  resource: Queue | Worker | QueueEvents | FlowProducer,
) {
  await resource.close();
  await resource.disconnect();
}

/**
 * Registers shutdown listeners for a BullMQ Queue or Worker.
 * This is important to ensure that resources are properly released when the process receives termination signals,
 * otherwise the connection will not close and run silently in the background, creating memory leaks.
 *
 * @internal This is automatically called by Riven and should not be used directly.
 *
 * @param resource - The BullMQ Queue or Worker to shut down on process termination signals.
 */
export function registerMQListeners(
  resource: Queue | Worker | QueueEvents | FlowProducer,
  logger: Logger,
) {
  const signals = ["SIGINT", "SIGTERM"] satisfies NodeJS.Signals[];
  const events = ["beforeExit"] as const;

  for (const on of [...signals, ...events]) {
    process.once(on, () => {
      void shutdownHandler(resource);
    });
  }

  (resource as EventEmitter).on("error", (error) => logger.error(error));
}
