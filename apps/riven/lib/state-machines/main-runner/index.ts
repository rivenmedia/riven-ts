import { RivenEvent } from "@repo/util-plugin-sdk/events";

import { Queue, Worker } from "bullmq";
import { enqueueActions, raise, setup } from "xstate";

import { indexerProcessor } from "../../message-queue/flows/indexing/indexing.processor.ts";
import { requestContentServicesProcessor } from "../../message-queue/flows/request-content-services/request-content-services.processor.ts";
import { createFlowWorker } from "../../message-queue/utilities/create-flow-worker.ts";
import { withLogAction } from "../utilities/with-log-action.ts";
import { requestContentServicesActor } from "./actors/request-content-services.actor.ts";
import { requestIndexData } from "./actors/request-index-data.actor.ts";
import { retryLibraryActor } from "./actors/retry-library.actor.ts";
import { createPluginHookWorkers } from "./utilities/create-plugin-hook-workers.ts";

import type { RetryLibraryEvent } from "../../message-queue/events/retry-library.event.ts";
import type { Flow } from "../../message-queue/flows/index.ts";
import type { PendingRunnerInvocationPlugin } from "../plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item/index-requested";

export interface MainRunnerMachineContext {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
  queues: Map<RivenEvent["type"], Queue>;
  flowWorkers: Map<Flow["name"], Worker>;
  publishableEvents: Set<RivenEvent["type"]>;
}

export interface MainRunnerMachineInput {
  plugins: Map<symbol, PendingRunnerInvocationPlugin>;
  queues: Map<RivenEvent["type"], Queue>;
}

export type MainRunnerMachineEvent = RetryLibraryEvent | RivenEvent;

export const mainRunnerMachine = setup({
  types: {
    context: {} as MainRunnerMachineContext,
    input: {} as MainRunnerMachineInput,
    events: {} as MainRunnerMachineEvent,
    children: {} as {
      requestContentServices: "requestContentServices";
    },
  },
  actions: {
    addEventToQueue: ({ context }, { type, ...event }: RivenEvent) => {
      const queue = context.queues.get(type);

      if (!queue) {
        throw new Error("Task queue not found");
      }

      void queue.add(type, event);
    },
    requestContentServices: enqueueActions(({ enqueue, context }) => {
      enqueue.spawnChild(requestContentServicesActor, {
        input: {
          subscribers: Array.from(
            context.plugins
              .values()
              .map((plugin) => plugin.config)
              .filter(({ hooks }) => hooks["riven.content-service.requested"]),
          ),
        },
      });
    }),
    requestIndexData: enqueueActions(
      (
        { enqueue, context },
        params: ParamsFor<MediaItemIndexRequestedEvent>,
      ) => {
        enqueue.spawnChild(requestIndexData, {
          input: {
            item: params.item,
            subscribers: Array.from(
              context.plugins
                .values()
                .map((plugin) => plugin.config)
                .filter(
                  ({ hooks }) => hooks["riven.media-item.index.requested"],
                ),
            ),
          },
        });
      },
    ),
    retryLibrary: enqueueActions(({ enqueue, self }) => {
      enqueue.spawnChild(retryLibraryActor, {
        id: "retry-library-actor" as never,
        input: {
          parentRef: self,
        },
      });
    }),
  },
  actors: {
    requestContentServices: requestContentServicesActor,
  },
  guards: {
    shouldQueueEvent: ({ event, context }) => {
      const parsedEvent = RivenEvent.safeParse(event);

      if (!parsedEvent.success) {
        return false;
      }

      return context.publishableEvents.has(parsedEvent.data.type);
    },
    isRivenEvent: ({ event }) => RivenEvent.safeParse(event).success,
  },
})
  .extend(withLogAction)
  .createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QCUCWA3MA7ABABwCcB7KAgQwFscKzVcCBXLLMAgYgI2wDoLJUyAWlQAXMBW4AqANoAGALqJQeIrFGoiWJSAAeiAIwAmADQgAnogCsATmvcAHEcsBfZ6bSZchEuSo06OIzMrBxcWIJ4ADYMUHS8-EKi4twEYACODHBiEHKKSCAqaiIaWvl6CEamFggALJaGDjYAzADsLm4gHtj4xKSU1LT0TCzsnJ7xEALCYhIAxqlkxZrcrMQEudqF6pra5ZXmiE2yltzWsgBshu3uYT0+-f5DwaNhE1NJcwtLWNxkkQsQMyCMA6VCwESwDb5LbfXYGEwHCqWeynSxNJyuG6eO59PyDQLDEJjHipEQEIGRVAAI3I5KhylU21KoD2COqRlcHSwRAgcG0XS8vV8AwCQRGm0ZsLKiDa3FkhhaTRqrUsVRlln03Ba50sl3ariAA */
    id: "Riven program main runner",
    context: ({ input, self }) => {
      const { publishableEvents } = createPluginHookWorkers(input.plugins);

      return {
        plugins: input.plugins,
        queues: input.queues,
        publishableEvents,
        flowWorkers: new Map<Flow["name"], Worker>([
          [
            "indexing",
            createFlowWorker("indexing", indexerProcessor, self.send),
          ],
          [
            "request-content-services",
            createFlowWorker(
              "request-content-services",
              requestContentServicesProcessor,
              self.send,
            ),
          ],
        ]),
      };
    },
    entry: [
      {
        type: "addEventToQueue",
        params: {
          type: "riven.core.started",
        },
      },
      { type: "requestContentServices" },
      raise({ type: "riven-internal.retry-library" }),
      {
        type: "log",
        params: {
          message: "Riven has started successfully.",
        },
      },
    ],
    always: [
      {
        guard: "shouldQueueEvent",
        actions: {
          type: "addEventToQueue",
          params: ({ event }) => RivenEvent.parse(event),
        },
      },
      {
        guard: "isRivenEvent",
        actions: {
          type: "log",
          params: ({ event }) => ({
            message: `Received event: ${event.type}`,
            level: "silly",
          }),
        },
      },
    ],
    on: {
      "riven.media-item.creation.success": {
        description:
          "Indicates that a media item has been successfully created in the library.",
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Successfully created media item: ${JSON.stringify(event.item)}`,
              level: "info",
            }),
          },
          {
            type: "requestIndexData",
            params: ({ event }) => ({
              item: event.item,
            }),
          },
        ],
      },
      "riven.media-item.creation.error": {
        description:
          "Indicates that an error occurred while attempting to create a media item in the library.",
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Error creating media item ${JSON.stringify(event.item)}: ${String(event.error)}`,
              level: "error",
            }),
          },
        ],
      },
      "riven.media-item.creation.already-exists": {
        description:
          "Indicates that a media item creation was attempted, but the item already exists in the library.",
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Media item already exists: ${JSON.stringify(event.item)}`,
              level: "verbose",
            }),
          },
        ],
      },
      "riven-internal.retry-library": {
        description:
          "Retries processing of any media items that are in a pending state.",
        actions: {
          type: "retryLibrary",
        },
      },
    },
  });

export type MainRunnerMachineIntake = (event: MainRunnerMachineEvent) => void;
