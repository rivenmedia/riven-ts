import type { MediaVideos } from "../schemas/media-videos.schema.ts";
import type { Trailer } from "@repo/util-plugin-sdk/dto/types/trailer.type";
import type z from "zod";

/**
 * Selects the highest resolution official trailer in the requested language.
 */
export function selectTrailer(
  videos: z.infer<typeof MediaVideos>["results"],
  language: string,
): Trailer | null {
  const { language: iso_639_1 } = new Intl.Locale(language);

  const officialTrailers = videos.filter(
    (video) =>
      video.type === "Trailer" &&
      video.official &&
      video.iso_639_1 === iso_639_1,
  );

  const [highestResolutionTrailer] = officialTrailers.toSorted(
    (a, b) => b.size - a.size,
  );

  if (!highestResolutionTrailer) {
    return null;
  }

  return {
    id: highestResolutionTrailer.id,
    key: highestResolutionTrailer.key,
    name: highestResolutionTrailer.name,
    site: highestResolutionTrailer.site,
    url: `https://www.youtube.com/watch?v=${highestResolutionTrailer.key}`,
  };
}
