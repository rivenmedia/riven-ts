import {
  FileSystemEntry,
  MediaEntry,
  SubtitleEntry,
} from "@rivenmedia/plugin-sdk/dto/entities";
import { UUID } from "@rivenmedia/plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { database } from "../../database/database.ts";
import { createApolloInstanceSchema } from "./create-apollo-instance-schema.ts";

/**
 * A schema that converts to/from a serialised filesystem entry.
 */
export const SerialisedFileSystemEntry = z.codec(
  UUID,
  z.xor([
    z.instanceof(FileSystemEntry),
    createApolloInstanceSchema(FileSystemEntry, MediaEntry, SubtitleEntry),
  ]),
  {
    decode: (id) => database.em.fork().findOneOrFail(FileSystemEntry, id),
    encode: (data) => UUID.parse(data.id),
  },
);

export type SerialisedFileSystemEntry = z.infer<
  typeof SerialisedFileSystemEntry
>;
