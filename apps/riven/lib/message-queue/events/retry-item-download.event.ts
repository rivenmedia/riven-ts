import { MediaItemInstance } from "@rivenmedia/plugin-sdk/schemas/media/media-item-instance";

import z from "zod";

import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

export const RetryItemDownload = createInternalEventSchema(
  "retry-item-download",
  z.object({
    item: MediaItemInstance,
  }),
);

export type RetryItemDownload = z.infer<typeof RetryItemDownload>;
