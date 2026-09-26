import { MediaItemType } from "./media-item-type.enum.ts";

import type z from "zod";

export const TopLevelMediaItemType = MediaItemType.extract(["movie", "show"]);

export type TopLevelMediaItemType = z.infer<typeof TopLevelMediaItemType>;
