import type { Replace } from "type-fest";

const imageConfig = {
  baseUrl: "https://image.tmdb.org/t/p/",
  backdropSizes: ["w300", "w780", "w1280", "original"],
  logoSizes: ["w45", "w92", "w154", "w185", "w300", "w500", "original"],
  posterSizes: ["w92", "w154", "w185", "w342", "w500", "w780", "original"],
  profileSizes: ["w45", "w185", "w632", "original"],
  stillSizes: ["w92", "w185", "w300", "original"],
} as const;

/**
 * Formats a TMDB image URL based on the provided path, image type, and size.
 *
 * @param path The path to the TMDB image
 * @param imageType The image type
 * @param size The image size
 * @returns The fully-formatted image URL
 */
export function formatImageUrl<
  T extends Replace<
    Extract<keyof typeof imageConfig, `${string}Sizes`>,
    "Sizes",
    ""
  >,
>(
  path: string | null | undefined,
  imageType: T,
  size: (typeof imageConfig)[`${typeof imageType}Sizes`][number] = "original",
) {
  if (!path) {
    return null;
  }

  return `${imageConfig.baseUrl}${size}${path}`;
}
