import { registerEnumType } from "type-graphql";
import z from "zod";

export const LibrarySectionOverrideMode = z.enum(["include", "exclude"]);

export type LibrarySectionOverrideMode = z.infer<
  typeof LibrarySectionOverrideMode
>;

registerEnumType(LibrarySectionOverrideMode.enum, {
  name: "LibrarySectionOverrideMode",
  description:
    "Whether a manual override forces a media item into a library section or out of it, regardless of the section's rule",
});
