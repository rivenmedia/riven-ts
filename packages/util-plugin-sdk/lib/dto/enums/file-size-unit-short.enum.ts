import z from "zod";

export const FileSizeUnitShort = z.enum(["B", "KiB", "MiB", "GiB"]);

export type FileSizeUnitShort = z.infer<typeof FileSizeUnitShort>;
