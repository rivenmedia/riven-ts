import z from "zod";

import { MediaItem as MediaItemEntity } from "../../dto/entities/media-items/media-item.entity.ts";

export const MediaItem = z.instanceof(MediaItemEntity);
