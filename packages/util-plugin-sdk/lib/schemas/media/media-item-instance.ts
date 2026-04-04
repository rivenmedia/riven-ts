import { type } from "arktype";

import { MediaItem } from "../../dto/entities/media-items/media-item.entity.ts";

export const MediaItemInstance = type.instanceOf(MediaItem);

export type MediaItemInstance = typeof MediaItemInstance.infer;
