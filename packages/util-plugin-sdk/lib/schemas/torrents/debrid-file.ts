import z from "zod";

export const DebridFile = z.object({
  link: z.string().min(1).optional(),
  name: z.string().min(1),
  path: z.string().min(1),
  size: z.int().positive(),
  video_hash: z.string().optional(),
});

export type DebridFile = z.infer<typeof DebridFile>;
