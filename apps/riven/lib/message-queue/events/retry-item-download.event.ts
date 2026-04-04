import { MediaItemInstance } from "@repo/util-plugin-sdk/schemas/media/media-item-instance";

import { type } from "arktype";

import { createInternalEventSchema } from "../utilities/create-internal-event-schema.ts";

export const RetryItemDownload = createInternalEventSchema(
  "retry-item-download",
  type({
    item: MediaItemInstance,
  }),
);

export type RetryItemDownload = typeof RetryItemDownload.infer;
