import { Injectable, Module } from "@nestjs/common";

import { clearDeduplicationJob } from "./utilities/clear-deduplication-job.ts";
import { createQueue } from "./utilities/create-queue.ts";
import { queueRegistry } from "./utilities/queue-registry.ts";

import type { Queue, QueueOptions } from "bullmq";

/**
 * Provides access to the queues Riven has created.
 *
 * Wraps the existing registry rather than replacing it. Queues are also created
 * from sandboxed job processors, which run in worker threads and so have no
 * access to the DI container, meaning the registry cannot become container
 * state.
 */
@Injectable()
export class QueueRegistryService {
  /**
   * Returns the named queue, creating it if it does not yet exist.
   *
   * @param name The queue name
   * @param options Queue options
   *
   * @returns The queue
   */
  public create(
    name: string,
    options: Omit<QueueOptions, "connection" | "telemetry"> = {},
  ): Queue {
    return createQueue(name, options);
  }

  /**
   * Returns the named queue if it has been created.
   *
   * @param name The queue name
   *
   * @returns The queue, or undefined
   */
  public get(name: string): Queue | undefined {
    return queueRegistry.get(name);
  }

  /**
   * Removes a job from the given queue by its deduplication identifier.
   *
   * @param queueName The queue name in which the job is stored
   * @param deduplicationId The deduplication identifier given to the job
   *
   * @returns Whether the job was removed
   */
  public async clearDeduplicationJob(
    queueName: string,
    deduplicationId: string,
  ): Promise<boolean> {
    return clearDeduplicationJob(queueName, deduplicationId);
  }
}

/**
 * Exposes the message queue infrastructure to the DI container.
 *
 * `@nestjs/bullmq` is deliberately not used. The flow queues are static and
 * would fit its model, but plugin hook queues are created per plugin and per
 * event type only once plugin discovery has run, which its static module graph
 * cannot express. The existing queue utilities are wrapped instead, so that
 * queues stay shared with the worker threads and state machine actors that
 * cannot reach the container.
 */
@Module({
  providers: [QueueRegistryService],
  exports: [QueueRegistryService],
})
export class MessageQueueModule {}
