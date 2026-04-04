import { type } from "arktype";

import { MediaEntry } from "../../dto/entities/filesystem/media-entry.entity.ts";

export const MediaEntryInstance = type.instanceOf(MediaEntry);

export type MediaEntryInstance = typeof MediaEntryInstance.infer;
