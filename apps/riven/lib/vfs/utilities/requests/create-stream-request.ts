import { request } from "undici";

import { logger } from "../../../utilities/logger/logger.ts";
import { config } from "../../config.ts";
import { fdToResponsePromiseMap } from "../file-handle-map.ts";

export function createStreamRequest(
  fd: number,
  url: string,
  [requestStart, requestEnd]: readonly [number, number | undefined],
) {
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

    fdToResponsePromiseMap.set(fd, streamReaderPromise);
  }

  return streamReaderPromise;
}
