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
    encode: (data, ctx) => {
      if (!data.id) {
        ctx.issues.push({
          code: "invalid_type",
          expected: "FileSystemEntryInstance with an ID",
          received: "FileSystemEntryInstance without an ID",
          input: data,
        });

        return z.NEVER;
      }

      if (typeof data.id !== "string") {
        ctx.issues.push({
          code: "invalid_type",
          expected: "FileSystemEntryInstance with a string ID",
          received: `FileSystemEntryInstance with a non-string ID of type ${typeof data.id}`,
          input: data,
        });

        return z.NEVER;
      }

      return data.id;
    },
  },
);

export type SerialisedFileSystemEntry = z.infer<
  typeof SerialisedFileSystemEntry
>;
