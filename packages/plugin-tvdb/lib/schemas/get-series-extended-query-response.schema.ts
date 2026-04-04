import { type } from "arktype";

import type { GetSeriesExtendedQueryResponse as BaseGetSeriesExtendedQueryResponse } from "../__generated__/index.ts";

export const GetSeriesExtendedQueryResponse = type
  .declare<BaseGetSeriesExtendedQueryResponse>()
  .type({
    "data?": type({}),
    "status?": "string",
  });

export type GetSeriesExtendedQueryResponse =
  typeof GetSeriesExtendedQueryResponse.infer;
