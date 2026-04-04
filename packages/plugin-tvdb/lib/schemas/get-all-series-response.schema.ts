import { type } from "arktype";

import type { GetAllSeries200 } from "../__generated__/index.ts";

export const GetAllSeriesResponse = type.declare<GetAllSeries200>().type({
  "data?": type({}).array(),
  "links?": {},
  "status?": "string",
});

export type GetAllSeriesResponse = typeof GetAllSeriesResponse.infer;
