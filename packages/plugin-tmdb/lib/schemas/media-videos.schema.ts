import z from "zod";

import { MediaVideo } from "./media-video.schema.ts";

export const MediaVideos = z.object({
  id: z.int(),
  results: z.array(MediaVideo),
});

export type MediaVideos = z.infer<typeof MediaVideos>;
