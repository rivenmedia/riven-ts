import {
  FileSystemEntry,
  MediaEntry,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { repositories } from "../../database/database.ts";
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
    decode: (id) => repositories.filesystemEntry.findOneOrFail(id),
    encode: (data) => UUID.parse(data.id),
  },
);

export type SerialisedFileSystemEntry = z.infer<
  typeof SerialisedFileSystemEntry
>;
