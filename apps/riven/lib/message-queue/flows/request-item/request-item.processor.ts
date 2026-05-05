import { requestItemProcessorSchema } from "./request-item.schema.ts";

export const requestItemProcessor = requestItemProcessorSchema.implementAsync(
  async ({ job, signal }, { sendEvent, services: { itemRequestService } }) => {
    const { item } = job.data;

    console.log(item);
  },
);
