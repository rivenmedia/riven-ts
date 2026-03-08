import z from "zod";

export const DebridFile = z.object({
  fileId: z.int().optional(),
  fileName: z
    .string()
    .refine(
      (name) => !/sample/i.test(name),
      "File name should not contain the word 'sample'",
    ),
  fileSize: z.int(),
  downloadUrl: z.url().optional(),
});

export type DebridFile = z.infer<typeof DebridFile>;
