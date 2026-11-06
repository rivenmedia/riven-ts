import { formatImageUrl } from "./format-image-url.ts";

import type { MediaImage } from "../schemas/media-image.schema.ts";
import type { ItemImage } from "@repo/util-plugin-sdk/dto/types/item-image.type";

const byRating = (a: MediaImage, b: MediaImage) =>
  b.vote_average - a.vote_average || b.vote_count - a.vote_count;

interface SelectLogoOptions {
  width: number | null;
  aspectRatio: number | null;
  language: string;
}

function toItemImage(logo: MediaImage | undefined): ItemImage | null {
  if (!logo?.file_path) {
    return null;
  }

  const imageUrl = formatImageUrl(logo.file_path, "logo", "original");

  if (!imageUrl) {
    return null;
  }

  return {
    url: imageUrl,
    height: logo.height,
    width: logo.width,
    aspectRatio: logo.aspect_ratio,
  };
}

/**
 * Selects the most appropriate logo for the requested language and dimensions.
 *
 * With no dimensions, the highest-rated logo is returned. Otherwise, the logo closest
 * to the requested aspect ratio and width is returned, preferring logos that do not need upscaling.
 */
export function selectLogo(
  logos: MediaImage[],
  { width, aspectRatio, language }: SelectLogoOptions,
): ItemImage | null {
  const { language: iso_639_1 } = new Intl.Locale(language);

  // Language-neutral logos (no iso_639_1) are kept, as they are usable in any locale
  const candidates = logos.filter(
    (logo) =>
      logo.file_path && (!logo.iso_639_1 || logo.iso_639_1 === iso_639_1),
  );

  if (candidates.length === 0) {
    return null;
  }

  if (width === null && aspectRatio === null) {
    const [highestRatedLogo] = candidates.toSorted(byRating);

    return toItemImage(highestRatedLogo);
  }

  // Prefer logos that are at least as wide as requested to avoid upscaling,
  // falling back to all candidates if none are large enough
  const largeEnoughLogos =
    width === null
      ? candidates
      : candidates.filter((logo) => logo.width >= width);

  const sizedCandidates =
    largeEnoughLogos.length > 0 ? largeEnoughLogos : candidates;

  const [closestLogo] = sizedCandidates.toSorted((a, b) => {
    if (aspectRatio !== null) {
      const aspectRatioDelta =
        Math.abs(a.aspect_ratio - aspectRatio) -
        Math.abs(b.aspect_ratio - aspectRatio);

      if (aspectRatioDelta !== 0) {
        return aspectRatioDelta;
      }
    }

    if (width !== null) {
      const widthDelta = Math.abs(a.width - width) - Math.abs(b.width - width);

      if (widthDelta !== 0) {
        return widthDelta;
      }
    }

    return byRating(a, b);
  });

  return toItemImage(closestLogo);
}
