import { z } from "zod";

import { SubtitleResponse } from "./subtitle-response.schema.ts";

const SubtitleSearchSuccessResponse = z.object({
  status: z.literal(true),
  results: z
    .array(
      z.object({
        sd_id: z.number().optional(),
        name: z.string().optional(),
      }),
    )
    .optional(),
  subtitles: z.array(SubtitleResponse).optional(),
});

const SubtitleSearchErrorResponse = z.object({
  status: z.literal(false),
  error: z.string(),
});

export const SubtitleSearchResponse = z.discriminatedUnion("status", [
  SubtitleSearchSuccessResponse,
  SubtitleSearchErrorResponse,
]);

export type SubtitleSearchResponse = z.infer<typeof SubtitleSearchResponse>;
