import { setInterval } from "node:timers";
import { fromCallback } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

import type { RivenInternalEvent } from "../../../message-queue/events/index.ts";
import type { MainRunnerMachineEvent } from "../index.ts";

export interface EventSchedulerInput {
  interval: number;
  event: RivenInternalEvent["type"];
  runImmediately?: boolean;
}

export const eventScheduler = fromCallback<
  MainRunnerMachineEvent,
  EventSchedulerInput
>(({ sendBack, input }) => {
  logger.verbose(
    `Scheduling event "${input.event}" to run every ${input.interval.toString()}ms`,
  );

  const handler = () => {
    sendBack({ type: input.event });
  };

  if (input.runImmediately) {
    handler();
  }

  const interval = setInterval(handler, input.interval);

  return () => {
    logger.verbose(`Stopping event scheduler for "${input.event}"`);

    clearInterval(interval);
  };
});
