import { request } from "undici";

import { logger } from "../../../utilities/logger/logger.ts";
import { config } from "../../config.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToResponsePromiseMap,
} from "../file-handle-map.ts";
import { getVfsOperationContext } from "../vfs-operation-context.ts";

export function createStreamRequest(
  url: string,
  [requestStart, requestEnd]: readonly [number, number | undefined],
) {
  const { fd } = getVfsOperationContext("read");
  const streamReaderPromise = request(url, {
    highWaterMark: config.chunkSize,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range: `bytes=${[requestStart, requestEnd].join("-")}`,
    },
  });

  // If the request end is undefined, it means this is the main stream request.
  // Cache the promise to prevent multiple requests being made.
  if (requestEnd === undefined) {
    logger.silly(
      `Storing stream reader promise for fd ${fd.toString()} from position: ${requestStart.toString()}`,
    );

    fdToCurrentStreamPositionMap.set(fd, requestStart);
    fdToResponsePromiseMap.set(fd, streamReaderPromise);
  }

  return streamReaderPromise;
}
