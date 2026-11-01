import { atLeastOnePropertyRequired } from "@repo/util-plugin-sdk/validation";

import { z } from "zod";

export const ExternalIds = z
  .object({
    tmdbId: z.string().nullish(),
    tvdbId: z.string().nullish(),
    imdbId: z.string().nullish(),
  })
  .refine(atLeastOnePropertyRequired);

export type ExternalIds = z.infer<typeof ExternalIds>;
