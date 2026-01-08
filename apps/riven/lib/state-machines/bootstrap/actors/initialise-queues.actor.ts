import { RivenEvent } from "@repo/util-plugin-sdk";

import { Queue } from "bullmq";
import { fromPromise } from "xstate";

import { createQueue } from "../../../message-queue/utilities/create-queue.ts";

/**
 * Initialises all required queues for the main runner.
 *
 * Each program to plugin event type gets its own queue. Workers are registered when the main runner starts,
 * where each hook provided by a plugin registers a new worker associated with the event it subscribes to.
 */
export const initialiseQueues = fromPromise<Map<RivenEvent["type"], Queue>>(
  async () => {
    const queueMap = new Map<RivenEvent["type"], Queue>();

    for (const event of RivenEvent.options) {
      // This is only ever a single-length array,
      // but Zod literals can represent multiple values,
      // so we have to iterate over them.
      for (const discriminatorOption of event.shape.type.def.values) {
        if (!queueMap.has(discriminatorOption)) {
          const queue = await createQueue(discriminatorOption);

          queueMap.set(discriminatorOption, queue);
        }
      }
    }

    return queueMap;
  },
);
