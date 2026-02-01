import { database } from "@repo/core-util-database/database";
import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities/filesystem/media-entry.entity";

import { wrap } from "@mikro-orm/core";
import z from "zod";

export const SerialisedMediaEntry = z.codec(
  // Just validate the input has a matching media item type here
  // to prevent non-media items from being passed through
  z.looseObject({ provider: z.string() }),
  z.instanceof(MediaEntry),
  {
    decode: (data) =>
      database.mediaEntry.create(data, {
        persist: false,
        partial: true,
        managed: true,
      }),
    encode: (data) => wrap(data).toPOJO(),
  },
);

export type SerialisedMediaEntry = z.infer<typeof SerialisedMediaEntry>;
