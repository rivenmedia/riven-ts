import { request } from "undici";

import { config } from "../../config.ts";

export function createStreamRequest(
  url: string,
  [requestStart, requestEnd]: readonly [number, number | undefined],
) {
  return request(url, {
    highWaterMark: config.chunkSize,
    headers: {
      "accept-encoding": "identity",
      connection: "keep-alive",
      range: `bytes=${[requestStart, requestEnd].join("-")}`,
    },
  });
}
