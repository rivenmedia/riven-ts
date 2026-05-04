import { z } from "zod";

import { SubtitleResponse } from "./subtitle-response.schema.ts";

const subtitleSearchSuccessResponseSchema = z.object({
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

const subtitleSearchErrorResponseSchema = z.object({
  status: z.literal(false),
  error: z.string(),
});

export const subtitleSearchResponseSchema = z.discriminatedUnion("status", [
  subtitleSearchSuccessResponseSchema,
  subtitleSearchErrorResponseSchema,
]);

export type SubtitleSearchResponse = z.infer<
  typeof subtitleSearchResponseSchema
>;
