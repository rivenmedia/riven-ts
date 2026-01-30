import z from "zod";

// const ANIME_SPECIALS_PATTERN = new RegExp(
//   "\\b(OVA|NCED|NCOP|NC|OVA|ED(\\d?v?\\d?)|OPv?(\\d+)?|SP\\d+)\\b",
//   "i",
// );

export const DebridFile = z.object({
  fileId: z.int().optional(),
  fileName: z
    .string()
    .refine(
      (name) => !name.toLowerCase().includes("sample"),
      "File name should not contain the word 'sample'",
    ),
  fileSize: z.int(),
  downloadUrl: z.url().optional(),
});

export type DebridFile = z.infer<typeof DebridFile>;
