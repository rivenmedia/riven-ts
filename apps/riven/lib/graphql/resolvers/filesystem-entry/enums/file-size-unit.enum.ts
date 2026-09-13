import { registerEnumType } from "type-graphql";
import z from "zod";

export const FileSizeUnit = z.enum([
  "byte",
  "kilobyte",
  "megabyte",
  "gigabyte",
]);

export type FileSizeUnit = z.infer<typeof FileSizeUnit>;

registerEnumType(FileSizeUnit.enum, {
  name: "FileSizeUnit",
  description: "Units for file size",
});
