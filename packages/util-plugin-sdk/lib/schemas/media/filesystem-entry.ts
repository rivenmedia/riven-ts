import z from "zod";

import { FileSystemEntry as FileSystemEntryEntity } from "../../dto/entities/filesystem/filesystem-entry.entity.ts";

export const FileSystemEntry = z.instanceof(FileSystemEntryEntity);
