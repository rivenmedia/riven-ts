import { registerEnumType } from "type-graphql";
import z from "zod";

export const FileSizeUnitShort = z.enum(["B", "KiB", "MiB", "GiB"]);

export type FileSizeUnitShort = z.infer<typeof FileSizeUnitShort>;

registerEnumType(FileSizeUnitShort.enum, {
  name: "FileSizeUnitShort",
  description: "Short units for file size",
});
