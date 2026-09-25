import z from "zod";

export const FileSizeUnit = z.enum([
  "byte",
  "kilobyte",
  "megabyte",
  "gigabyte",
]);

export type FileSizeUnit = z.infer<typeof FileSizeUnit>;
