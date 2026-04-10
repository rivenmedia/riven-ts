import z from "zod";

import type { MediaEntry } from "../../dto/entities/index.ts";
import type { EntityData } from "@mikro-orm/core";

export const MediaEntryInstance = z.custom<EntityData<MediaEntry>>();

export type MediaEntryInstance = z.infer<typeof MediaEntryInstance>;
