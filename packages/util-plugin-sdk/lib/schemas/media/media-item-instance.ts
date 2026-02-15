import z from "zod";

import { MediaItem } from "../../dto/entities/media-items/media-item.entity.ts";

export const MediaItemInstance = z.instanceof(MediaItem);
