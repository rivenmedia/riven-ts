/**
 * A minimal PNG codec for comparing snapshots, as the report is built without installing dependencies.
 *
 * Only decodes the non-interlaced 8-bit RGB and RGBA images that the component tests take.
 */
import { promisify } from "node:util";
import { crc32, deflate, inflate } from "node:zlib";

const inflateAsync = promisify(inflate);

const deflateAsync = promisify(deflate);

export const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** Snapshots are far smaller, so this only guards against decompression bombs */
const MAX_PIXELS = 64 * 1024 * 1024;

/** The bytes per pixel of each supported colour type */
const CHANNELS = new Map([
  [2, 3],
  [6, 4],
]);

export interface DecodedImage {
  width: number;
  height: number;
  /** One RGBA value per pixel, in rows from the top left */
  pixels: Uint32Array;
}

const paeth = (left: number, up: number, upLeft: number) => {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);

  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left;
  }

  return upDistance <= upLeftDistance ? up : upLeft;
};

/** Predicts each byte from its neighbours, indexed by the filter type that starts each row */
const PREDICTORS = [
  () => 0,
  (left: number) => left,
  (_left: number, up: number) => up,
  (left: number, up: number) => Math.floor((left + up) / 2),
  paeth,
];

/** Splits a PNG into its header and concatenated image data */
const readChunks = (contents: Buffer) => {
  let header: Buffer | null = null;
  const data: Buffer[] = [];

  for (let offset = 8; offset + 8 <= contents.length;) {
    const length = contents.readUInt32BE(offset);
    const type = contents.toString("latin1", offset + 4, offset + 8);
    const chunk = contents.subarray(offset + 8, offset + 8 + length);

    if (type === "IEND") {
      break;
    }

    if (type === "IHDR") {
      header = chunk;
    } else if (type === "IDAT") {
      data.push(chunk);
    }

    offset += length + 12;
  }

  return { header, data: Buffer.concat(data) };
};

/** Reads the dimensions from a header, or returns null if the format is not supported */
const readHeader = (header: Buffer | null) => {
  if (header?.length !== 13) {
    return null;
  }

  const width = header.readUInt32BE(0);
  const height = header.readUInt32BE(4);
  const channels = CHANNELS.get(header.readUInt8(9));

  // Bit depth 8, deflate compression, adaptive filtering and no interlacing
  if (
    !channels ||
    header.readUInt8(8) !== 8 ||
    header.readUInt8(10) !== 0 ||
    header.readUInt8(11) !== 0 ||
    header.readUInt8(12) !== 0 ||
    width * height > MAX_PIXELS
  ) {
    return null;
  }

  return { width, height, channels };
};

/** Reverses the filter applied to each row, or returns null if one is invalid */
const unfilter = (
  filtered: Buffer,
  {
    width,
    height,
    channels,
  }: { width: number; height: number; channels: number },
) => {
  const stride = width * channels;
  const raw = new Uint8Array(stride * height);

  for (let row = 0; row < height; row++) {
    const predict = PREDICTORS[filtered[row * (stride + 1)] ?? -1];
    const source = row * (stride + 1) + 1;
    const target = row * stride;

    if (!predict) {
      return null;
    }

    for (let i = 0; i < stride; i++) {
      const hasLeft = i >= channels;
      const left = hasLeft ? (raw[target + i - channels] ?? 0) : 0;
      const up = row > 0 ? (raw[target + i - stride] ?? 0) : 0;
      const upLeft =
        hasLeft && row > 0 ? (raw[target + i - stride - channels] ?? 0) : 0;

      // Overflows wrap around, as the filters are defined modulo 256
      raw[target + i] = (filtered[source + i] ?? 0) + predict(left, up, upLeft);
    }
  }

  return raw;
};

/** Decodes a PNG, or returns null if it is not in a supported format */
export const decodePng = async (contents: Buffer) => {
  if (!contents.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }

  const { header, data } = readChunks(contents);
  const format = readHeader(header);

  if (!format) {
    return null;
  }

  const { width, height, channels } = format;
  const expectedLength = (width * channels + 1) * height;
  const filtered = await inflateAsync(data, {
    maxOutputLength: expectedLength,
  }).catch(() => null);
  const raw =
    filtered?.length === expectedLength ? unfilter(filtered, format) : null;

  if (!raw) {
    return null;
  }

  const rgba = new Uint8Array(width * height * 4);

  for (let pixel = 0; pixel < width * height; pixel++) {
    rgba.set(raw.subarray(pixel * channels, pixel * channels + 3), pixel * 4);
    rgba[pixel * 4 + 3] =
      channels === 4 ? (raw[pixel * channels + 3] ?? 0) : 255;
  }

  const image: DecodedImage = {
    width,
    height,
    pixels: new Uint32Array(rgba.buffer),
  };

  return image;
};

const chunk = (type: string, data: Buffer) => {
  const typeAndData = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  checksum.writeUInt32BE(crc32(typeAndData));

  return Buffer.concat([length, typeAndData, checksum]);
};

/** Encodes an image as an unfiltered 8-bit RGBA PNG */
export const encodePng = async ({ width, height, pixels }: DecodedImage) => {
  const header = Buffer.alloc(13);

  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  // Bit depth 8 and colour type 6 (RGBA), with the remaining fields left as zero
  header.writeUInt8(8, 8);
  header.writeUInt8(6, 9);

  const stride = width * 4;
  const rgba = new Uint8Array(
    pixels.buffer,
    pixels.byteOffset,
    stride * height,
  );
  // Each row starts with its filter type, which is zero (none)
  const filtered = Buffer.alloc((stride + 1) * height);

  for (let row = 0; row < height; row++) {
    filtered.set(
      rgba.subarray(row * stride, (row + 1) * stride),
      row * (stride + 1) + 1,
    );
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", await deflateAsync(filtered)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
};
