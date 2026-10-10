import { createUnionType } from "type-graphql";

import { MediaEntry, SubtitleEntry } from "#dto/entities/index.ts";

export const FileSystemEntryUnion = createUnionType({
  name: "FileSystemEntryUnion",
  types: () => [MediaEntry, SubtitleEntry] as const,
});
