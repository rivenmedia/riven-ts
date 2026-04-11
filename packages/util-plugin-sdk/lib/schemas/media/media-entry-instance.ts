import z from "zod";

import { MediaEntry } from "../../dto/entities/index.ts";

export const MediaEntryInstance = z.instanceof(MediaEntry);

export type MediaEntryInstance = z.infer<typeof MediaEntryInstance>;
