import { type Queue, type QueueEvents, Worker } from "bullmq";

async function shutdownHandler(resource: Queue | Worker | QueueEvents) {
  await resource.close();
  await resource.disconnect();
}

/**
 * Registers shutdown listeners for a BullMQ Queue or Worker.
 * This is important to ensure that resources are properly released when the process receives termination signals,
 * otherwise the connection will not close and run silently in the background, creating memory leaks.
 *
 * @param resource - The BullMQ Queue or Worker to shut down on process termination signals.
 */
export function registerMQListeners(resource: Queue | Worker | QueueEvents) {
  const signals = ["SIGINT", "SIGTERM"] satisfies NodeJS.Signals[];
  const events = ["beforeExit"] as const;

  for (const on of [...signals, ...events]) {
    process.once(on, () => {
      void shutdownHandler(resource);
    });
  }

  if (resource instanceof Worker) {
    resource.on("error", console.error);
  }
}
