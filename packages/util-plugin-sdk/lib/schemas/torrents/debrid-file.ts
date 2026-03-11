import z from "zod";

export const DebridFile = z.object({
  link: z.string().min(1).optional(),
  name: z.string(),
  path: z.string(),
  size: z.int(),
  video_hash: z.string().optional(),
});

export type DebridFile = z.infer<typeof DebridFile>;
