import { z } from "zod";

export const SubtitleResponse = z.object({
  release_name: z.string(),
  name: z.string(),
  lang: z.string(),
  author: z.string().optional(),
  url: z.string(),
  subtitlePage: z.string().optional(),
});

export type SubtitleResponse = z.infer<typeof SubtitleResponse>;
