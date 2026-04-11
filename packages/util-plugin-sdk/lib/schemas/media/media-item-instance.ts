import z from "zod";

import { MediaItem } from "../../dto/entities/index.ts";

export const MediaItemInstance = z.instanceof(MediaItem);

export type MediaItemInstance = z.infer<typeof MediaItemInstance>;
