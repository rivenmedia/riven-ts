import { ContentServiceRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import assert from "node:assert";

import { flow } from "#message-queue/flows/producer.ts";
import { createPluginFlowJob } from "#message-queue/utilities/create-flow-plugin-job.ts";
import { createJobParentConfig } from "#message-queue/utilities/create-job-parent-config.ts";
import { maybeWaitForChildren } from "#message-queue/utilities/maybe-wait-for-children.ts";
import { logger } from "#utilities/logger/logger.ts";

import { enqueueRequestContentService } from "./enqueue-request-content-service.ts";
import { requestContentServiceProcessorSchema } from "./request-content-service.schema.ts";
import { collectRequestedItems } from "./utilities/collect-requested-items.ts";
import { requestItems } from "./utilities/request-items.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export type RequestedItem =
  | {
      item: ContentServiceRequestedResponse["movies"][number];
      type: "movie";
    }
  | {
      type: "show";
      item: ContentServiceRequestedResponse["shows"][number];
    };

export const requestContentServiceProcessor =
  requestContentServiceProcessorSchema.implementAsync(
    async (
      { job, token, signal },
      { sendEvent, services: { itemRequestService } },
    ) => {
      assert.ok(token, "Token is required to create child jobs");

      const parent = createJobParentConfig(job);

      while (true) {
        switch (job.data.step) {
          case "request": {
            const childJob = createPluginFlowJob(
              ContentServiceRequestedEvent,
              "Request content service",
              job.data.contentServicePlugin,
              {},
              {
                parent,
                ignoreDependencyOnFailure: true,
              },
            );

            await flow.add(childJob);

            logger.silly(
              `Requesting content from ${job.data.contentServicePlugin}`,
            );

            await job.updateData({
              ...job.data,
              step: "process",
            });

            await maybeWaitForChildren(job, token);

            break;
          }
          case "process": {
            const data = await job.getChildrenValues();

            const { items, updateIntervalSeconds } = collectRequestedItems(
              Object.values(data),
            );

            const { newItemsCount, updatedItemsCount } = await requestItems(
              items.values(),
              { itemRequestService, sendEvent, signal },
            );

            if (updateIntervalSeconds) {
              await job.removeDeduplicationKey();
              await enqueueRequestContentService(
                job.data.contentServicePlugin,
                updateIntervalSeconds,
              );
            }

            return {
              count: items.size,
              newItems: newItemsCount,
              updatedItems: updatedItemsCount,
            };
          }
        }
      }
    },
  );
