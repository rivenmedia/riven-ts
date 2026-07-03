import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

import z from "zod";

export const SearchForm = z.object({
  states: z.union([MediaItemState, z.literal("")]),
  types: z.union([MediaItemType, z.literal("")]),
  search: z.string(),
});
