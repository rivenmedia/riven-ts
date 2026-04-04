import { FileSystemEntryInstance } from "@repo/util-plugin-sdk/schemas/media/filesystem-entry-instance";

import { type } from "arktype";

import { database } from "../../database/database.ts";
import { createCodec } from "./create-codec.ts";

/**
 * A schema that converts to/from a serialised filesystem entry.
 */
export const SerialisedFileSystemEntry = createCodec(
  type("number > 0"),
  FileSystemEntryInstance,
  {
    decode: (id) => database.filesystemEntry.findOneOrFail(id),
    encode: (data) => data.id,
  },
);

export type SerialisedFileSystemEntry = typeof SerialisedFileSystemEntry;
