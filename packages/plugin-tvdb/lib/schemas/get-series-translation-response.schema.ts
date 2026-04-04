import { type } from "arktype";

import type { GetSeriesTranslation200 } from "../__generated__/index.ts";

export const GetSeriesTranslationResponse = type
  .declare<GetSeriesTranslation200>()
  .type({
    "data?": type({}),
    "status?": "string",
  });

export type GetSeriesTranslationResponse =
  typeof GetSeriesTranslationResponse.infer;
