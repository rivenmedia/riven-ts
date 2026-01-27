import { wrap } from "@mikro-orm/core";
import z from "zod";

import { MediaEntry } from "../../dto/entities/index.ts";

export const SerialisedMediaEntry = z.codec(
  // Just validate the input has a matching media item type here
  // to prevent non-media items from being passed through
  z.looseObject({ provider: z.string() }),
  z.instanceof(MediaEntry),
  {
    decode: (data) => MediaEntry.create(data),
    encode: (data) => wrap(data).toJSON(),
  },
);

export type SerialisedMediaEntry = z.infer<typeof SerialisedMediaEntry>;
