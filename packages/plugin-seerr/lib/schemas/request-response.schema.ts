import z from "zod";

import { getRequest200Schema } from "../__generated__/index.ts";
import { ExtendedMediaRequest } from "./extended-media-request.schema.ts";

export const RequestResponse = getRequest200Schema.extend({
  results: z.array(ExtendedMediaRequest).optional(),
});

export type RequestResponse = z.infer<typeof RequestResponse>;
