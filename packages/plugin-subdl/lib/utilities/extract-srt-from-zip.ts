import { extname } from "node:path";
import { promisify } from "node:util";
import { inflateRaw } from "node:zlib";

const inflateRawAsync = promisify(inflateRaw);

const SUBTITLE_FILE_EXTENSION = ".srt";

/**
 * Extract the first .srt file from a ZIP buffer using Node.js built-in zlib.
 *
 * ZIP local file header format:
 *
 * | Offset (bytes) | Size (bytes)  | Description                                        |
 * |:---------------|:--------------|:---------------------------------------------------|
 * | 0              | 4             | Local file header signature (must be `0x04034b50`) |
 * | 4              | 2             | Version needed to extract (minimum)                |
 * | 6              | 2             | General purpose bit flag                           |
 * | 8              | 2             | Compression method (0=stored, 8=deflate)           |
 * | 10             | 2             | File last modification time                        |
 * | 12             | 2             | File last modification date                        |
 * | 14             | 4             | CRC-32 of uncompressed data                        |
 * | 18             | 4             | Compressed size (or `0xFFFFFFFF` for ZIP64)        |
 * | 22             | 4             | Uncompressed size (or `0xFFFFFFFF` for ZIP64)      |
 * | 26             | 2             | File name length (*n*)                             |
 * | 28             | 2             | Extra field length (*m*)                           |
 * | 30             | *n*           | File name                                          |
 * | 30+*n*         | *m*           | Extra field                                        |
 *
 * @see https://en.wikipedia.org/wiki/ZIP_(file_format)#Local_file_header
 */
export async function extractSrtFromZip(
  buffer: Buffer,
): Promise<string | undefined> {
  let offset = 0;

  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);

    if (signature !== 0x04034b50) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const filenameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const filenameStart = offset + 30;
    const filename = buffer.toString(
      "utf8",
      filenameStart,
      filenameStart + filenameLength,
    );

    const dataStart = filenameStart + filenameLength + extraFieldLength;
    const compressedData = buffer.subarray(
      dataStart,
      dataStart + compressedSize,
    );

    if (extname(filename) === SUBTITLE_FILE_EXTENSION) {
      if (compressionMethod === 0) {
        return compressedData.toString("utf8");
      }

      if (compressionMethod === 8) {
        const decompressed = await inflateRawAsync(compressedData);

        return decompressed.toString("utf8");
      }
    }

    offset = dataStart + compressedSize;
  }

  return undefined;
}
