import { request } from "undici";

import { logger } from "../../../utilities/logger/logger.ts";
import { config } from "../../config.ts";
import { fdToResponsePromiseMap } from "../file-handle-map.ts";
import { getVfsOperationContext } from "../vfs-operation-context.ts";
import { deriveUrlAuth } from "./derive-url-auth.ts";

export function createStreamRequest(
  url: string,
  [requestStart, requestEnd]: readonly [number, number | undefined],
) {
  const { fd } = getVfsOperationContext("read");
  // Stream URLs may carry Basic-auth credentials as userinfo (altmount WebDAV);
  // undici ignores URL userinfo, so convert it to an Authorization header.
  const { url: requestUrl, headers: authHeaders } = deriveUrlAuth(url);
  const streamReaderPromise = request(requestUrl, {
    highWaterMark: config.chunkSize,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range: `bytes=${[requestStart, requestEnd].join("-")}`,
      ...authHeaders,
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
