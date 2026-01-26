import { request } from "undici";

import { config } from "../../config.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

export async function createStreamRequest(
  fileHandle: FileHandleMetadata,
  [requestStart, requestEnd]: readonly [number, number | undefined],
) {
  return request(fileHandle.url, {
    highWaterMark: config.chunkSize,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range: `bytes=${[requestStart, requestEnd].join("-")}`,
    },
  });
}
