import { FileSystemEntryInstance } from "@repo/util-plugin-sdk/schemas/media/filesystem-entry-instance";

import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised filesystem entry.
 */
export const SerialisedFileSystemEntry = z.codec(
  z.uuidv4(),
  FileSystemEntryInstance,
  {
    decode: (id) => database.filesystemEntry.findOneOrFail(id),
    encode: (data) => data.id,
  },
);

export type SerialisedFileSystemEntry = z.infer<
  typeof SerialisedFileSystemEntry
>;
