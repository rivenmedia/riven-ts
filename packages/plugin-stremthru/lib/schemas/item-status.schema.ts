import { type } from "arktype";

export const ItemStatus = type.enumerated(
  "cached",
  "downloaded",
  "downloading",
  "failed",
  "invalid",
  "processing",
  "queued",
  "unknown",
  "uploading",
);

export type ItemStatus = typeof ItemStatus.infer;
