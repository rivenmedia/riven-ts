import type { DecodedImage } from "./png.ts";

/**
 * The share of pixels two images have in common, aligned at the top left as in the component tests,
 * or null if it is below the minimum
 */
export const similarity = (
  a: DecodedImage,
  b: DecodedImage,
  minimum: number,
) => {
  const totalPixels = Math.max(a.width * a.height, b.width * b.height);
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  // Pixels outside the overlap are only in one image, so never match
  const allowedMismatches = totalPixels * (1 - minimum);
  let mismatches = totalPixels - width * height;

  for (let row = 0; row < height && mismatches <= allowedMismatches; row++) {
    for (let column = 0; column < width; column++) {
      if (
        a.pixels[row * a.width + column] !== b.pixels[row * b.width + column]
      ) {
        mismatches += 1;
      }
    }
  }

  return mismatches > allowedMismatches
    ? null
    : (totalPixels - mismatches) / totalPixels;
};

/** Highlights the pixels that differ in red, over a faded copy of the matching ones */
export const diffImages = (a: DecodedImage, b: DecodedImage) => {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const rgba = new Uint8Array(width * height * 4);
  const aBytes = new Uint8Array(
    a.pixels.buffer,
    a.pixels.byteOffset,
    a.pixels.byteLength,
  );

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const inA = row < a.height && column < a.width;
      const inB = row < b.height && column < b.width;
      const target = (row * width + column) * 4;

      if (!inA && !inB) {
        continue;
      }

      const aIndex = row * a.width + column;

      if (inA && inB && a.pixels[aIndex] === b.pixels[row * b.width + column]) {
        const luminance =
          0.299 * (aBytes[aIndex * 4] ?? 0) +
          0.587 * (aBytes[aIndex * 4 + 1] ?? 0) +
          0.114 * (aBytes[aIndex * 4 + 2] ?? 0);
        const faded = 255 - (255 - luminance) * 0.1;

        rgba.fill(faded, target, target + 3);
      } else {
        rgba[target] = 255;
      }

      rgba[target + 3] = 255;
    }
  }

  const diff: DecodedImage = {
    width,
    height,
    pixels: new Uint32Array(rgba.buffer),
  };

  return diff;
};
