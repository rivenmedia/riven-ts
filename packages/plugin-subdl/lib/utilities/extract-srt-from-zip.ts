import { promisify } from "node:util";
import { inflateRaw } from "node:zlib";

const inflateRawAsync = promisify(inflateRaw);

/**
 * Extract the first .srt file from a ZIP buffer using Node.js built-in zlib.
 *
 * ZIP local file header format:
 * - 4 bytes: signature (0x04034b50)
 * - 2 bytes: version needed
 * - 2 bytes: flags
 * - 2 bytes: compression method (0=stored, 8=deflate)
 * - 4 bytes: mod time/date
 * - 4 bytes: crc32
 * - 4 bytes: compressed size
 * - 4 bytes: uncompressed size
 * - 2 bytes: filename length
 * - 2 bytes: extra field length
 * - N bytes: filename
 * - M bytes: extra field
 * - compressed data
 */
export async function extractSrtFromZip(
  buffer: Buffer,
): Promise<string | undefined> {
  let offset = 0;

  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

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

    if (filename.endsWith(".srt")) {
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
