import { database } from "@repo/core-util-database/database";
import {
  FileSystemEntry,
  FileSystemEntryType,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { wrap } from "@mikro-orm/core";
import z from "zod";

export const SerialisedFileSystemEntry = z.codec(
  // Just validate the input has a matching media item type here
  // to prevent non-media items from being passed through
  z.looseObject({ type: FileSystemEntryType }),
  z.instanceof(FileSystemEntry),
  {
    decode: (data) => {
      switch (data.type) {
        case "media":
          return database.mediaEntry.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
        case "subtitle":
          return database.subtitleEntry.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
      }
    },
    encode: (data) => wrap(data).serialize(),
  },
);

export type SerialisedFileSystemEntry = z.infer<
  typeof SerialisedFileSystemEntry
>;
