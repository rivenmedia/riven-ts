import z from "zod";

import type { MediaItem } from "../../dto/entities/index.ts";
import type { EntityData } from "@mikro-orm/core";

export const MediaItemInstance = z.custom<EntityData<MediaItem>>();

export type MediaItemInstance = z.infer<typeof MediaItemInstance>;
