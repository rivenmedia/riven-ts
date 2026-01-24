import { request } from "undici";

import { config } from "../../config.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

export async function createStreamRequest(
  fileHandle: FileHandleMetadata,
  requestStart: number,
  requestEnd?: number,
) {
  const range = `bytes=${requestStart.toString()}-${requestEnd?.toString() ?? ""}`;

  return request(fileHandle.url, {
    highWaterMark: config.chunkSize,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range,
    },
  });
}
