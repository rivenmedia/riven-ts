import { z } from "zod";

import { MediaImage } from "./media-image.schema.ts";

export const MediaImages = z.object({
  id: z.int(),
  backdrops: z.array(MediaImage),
  logos: z.array(MediaImage),
  posters: z.array(MediaImage),
});
