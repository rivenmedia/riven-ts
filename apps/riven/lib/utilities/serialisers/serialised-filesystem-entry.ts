import { FileSystemEntryType } from "@repo/util-plugin-sdk/dto/entities";
import { FileSystemEntryInstance } from "@repo/util-plugin-sdk/schemas/media/filesystem-entry-instance";

import { wrap } from "@mikro-orm/core";
import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised filesystem entry.
 */
export const SerialisedFileSystemEntry = z.codec(
  z.looseObject({ type: FileSystemEntryType }),
  FileSystemEntryInstance,
  {
    decode: (data) => {
      switch (data.type) {
        case "media":
          return database.mediaEntry.create(
            {
              ...data,
              type: "media",
            },
            {
              persist: false,
              partial: true,
              managed: true,
            },
          );
        case "subtitle":
          return database.subtitleEntry.create(
            {
              ...data,
              type: "subtitle",
            },
            {
              persist: false,
              partial: true,
              managed: true,
            },
          );
      }
    },
    encode: (data) => wrap(data).serialize(),
  },
);

export type SerialisedFileSystemEntry = z.infer<
  typeof SerialisedFileSystemEntry
>;
