import z from "zod";

import { MediaEntry } from "../../dto/entities/filesystem/media-entry.entity.ts";

export const MediaEntryInstance = z.instanceof(MediaEntry);

export type MediaEntryInstance = z.infer<typeof MediaEntryInstance>;
