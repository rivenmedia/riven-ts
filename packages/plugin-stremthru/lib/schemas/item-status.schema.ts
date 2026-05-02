import { z } from "@rivenmedia/plugin-sdk/validation";

export const ItemStatus = z.enum([
  "cached",
  "downloaded",
  "downloading",
  "failed",
  "invalid",
  "processing",
  "queued",
  "unknown",
  "uploading",
]);

export type ItemStatus = z.infer<typeof ItemStatus>;
