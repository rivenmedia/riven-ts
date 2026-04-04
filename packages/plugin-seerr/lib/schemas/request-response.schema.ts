import { type } from "arktype";

import { ExtendedMediaRequest } from "./extended-media-request.schema.ts";

import type { GetRequest200 } from "../__generated__/index.ts";

export const RequestResponse = type
  .declare<GetRequest200>()
  .type({
    "pageInfo?": {
      "page?": "number",
      "pages?": "number",
      "results?": "number",
    },
    "results?": [
      {
        "createdAt?": "string",
        "is4k?": "boolean",
        "media?": {},
        "mediaId?": "number",
        "requestId?": "number",
        "status?": "string",
        "updatedAt?": "string",
      },
    ],
  })
  .merge({
    results: ExtendedMediaRequest.array(),
  });

export type RequestResponse = typeof RequestResponse.infer;
