import z from "zod";

import type { FileSystemEntry } from "../../dto/entities/index.ts";
import type { EntityData } from "@mikro-orm/core";

export const FileSystemEntryInstance = z.custom<EntityData<FileSystemEntry>>();
