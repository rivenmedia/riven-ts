import { SerialisedMediaItem } from "@repo/util-plugin-sdk/schemas/media/serialised-media-item.schema";

import z from "zod";

import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

export const RetryItemDownload = createInternalEventSchema(
  "retry-item-download",
  z.object({
    item: SerialisedMediaItem,
  }),
);

export type RetryItemDownload = z.infer<typeof RetryItemDownload>;
