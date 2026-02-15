import z from "zod";

import { FileSystemEntry } from "../../dto/entities/filesystem/filesystem-entry.entity.ts";

export const FileSystemEntryInstance = z.instanceof(FileSystemEntry);
