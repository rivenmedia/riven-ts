import { processRequestedItem } from "../../../state-machines/main-runner/actors/process-requested-item.actor.ts";
import { requestContentServicesProcessorSchema } from "./request-content-services.schema.ts";

import type { RequestedItem } from "@repo/util-plugin-sdk/schemas/media-item/requested-item";

export const requestContentServicesProcessor =
  requestContentServicesProcessorSchema.implementAsync(
    async (job, sendEvent) => {
      const data = await job.getChildrenValues();

      const items = Object.values(data).reduce<RequestedItem[]>(
        (acc, childData) => [...acc, ...childData],
        [],
      );

      const results = await Promise.allSettled(
        items.map(async (item) =>
          processRequestedItem({
            item,
            sendEvent,
          }),
        ),
      );

      return {
        success: true,
        result: {
          count: items.length,
          newItems: results.filter(
            (result) => result.status === "fulfilled" && result.value.isNewItem,
          ).length,
        },
      };
    },
  );
