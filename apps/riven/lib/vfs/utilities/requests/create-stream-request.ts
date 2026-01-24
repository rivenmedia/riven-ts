import { config } from "../../config.ts";
import { requestAgent } from "./request-agent.ts";

import type { FileHandleMetadata } from "../file-handle-map.ts";

export async function createStreamRequest(
  fileHandle: FileHandleMetadata,
  requestStart: number,
  requestEnd?: number,
) {
  const { pathname, origin } = new URL(fileHandle.url);

  const range = `bytes=${requestStart.toString()}-${requestEnd?.toString() ?? ""}`;

  return requestAgent.request({
    method: "GET",
    origin,
    path: pathname,
    highWaterMark: config.chunkSize,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range,
    },
  });
}
