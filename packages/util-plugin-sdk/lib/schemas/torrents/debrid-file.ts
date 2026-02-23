import z from "zod";

const ANIME_SPECIALS_PATTERN =
  /\b(OVA|NCED|NCOP|NC|OVA|ED(\d?v?\d?)|OPv?(\d+)?|SP\d+)\b/i;

export const DebridFile = z.object({
  fileId: z.int().optional(),
  fileName: z
    .string()
    .refine(
      (name) => !name.toLowerCase().includes("sample"),
      "File name should not contain the word 'sample'",
    )
    .refine(
      (name) => !ANIME_SPECIALS_PATTERN.test(name),
      "File name should not match common anime special episode patterns (OVA, OVA, NCOP, etc.)",
    ),
  fileSize: z.int(),
  downloadUrl: z.url().optional(),
});

export type DebridFile = z.infer<typeof DebridFile>;
