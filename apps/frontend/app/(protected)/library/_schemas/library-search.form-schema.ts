import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { z } from "zod";

export const LibrarySearchForm = z.object({
  search: z.string().optional(),
  type: z.enum(["movies", "tv", "all"]),
  state: z.enum([...MediaItemState.options, "all"]),
});

export type LibrarySearchFormValues = z.infer<typeof LibrarySearchForm>;
