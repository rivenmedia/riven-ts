import { type } from "arktype";

import { FileSystemEntry } from "../../dto/entities/filesystem/filesystem-entry.entity.ts";

export const FileSystemEntryInstance = type.instanceOf(FileSystemEntry);

export type FileSystemEntryInstance = typeof FileSystemEntryInstance.infer;
