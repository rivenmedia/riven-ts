import z from "zod";

import { FileSystemEntry } from "../../dto/entities/index.ts";

export const FileSystemEntryInstance = z.instanceof(FileSystemEntry);

export type FileSystemEntryInstance = z.infer<typeof FileSystemEntryInstance>;
