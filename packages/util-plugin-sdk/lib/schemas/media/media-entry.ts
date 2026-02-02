import z from "zod";

import { MediaEntry as MediaEntryEntity } from "../../dto/entities/filesystem/media-entry.entity.ts";

export const MediaEntry = z.instanceof(MediaEntryEntity);
