import chalk from "chalk";
import { setInterval } from "node:timers";
import { fromCallback } from "xstate";

import { logger } from "../../../utilities/logger/logger.ts";

import type { RivenInternalEvent } from "../../../message-queue/events/index.ts";
import type { MainRunnerMachineEvent } from "../index.ts";

export interface CreateEventSchedulerInput {
  interval: number;
  event: RivenInternalEvent["type"];
  runImmediately?: boolean;
}

export const createEventScheduler = fromCallback<
  MainRunnerMachineEvent,
  CreateEventSchedulerInput
>(({ sendBack, input }) => {
  logger.verbose(
    `Scheduling event ${chalk.blue(input.event)} to run every ${input.interval.toString()}ms`,
  );

  const handler = () => {
    sendBack({ type: input.event });
  };

  if (input.runImmediately) {
    handler();
  }

  const interval = setInterval(handler, input.interval);

  return () => {
    logger.verbose(`Stopping event scheduler for ${chalk.blue(input.event)}`);

    clearInterval(interval);
  };
});
