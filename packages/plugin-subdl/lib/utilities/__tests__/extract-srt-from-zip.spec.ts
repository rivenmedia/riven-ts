import { promisify } from "node:util";
import { deflateRaw } from "node:zlib";
import { describe, expect, it } from "vitest";

import { extractSrtFromZip } from "../extract-srt-from-zip.ts";

const deflateRawAsync = promisify(deflateRaw);

function buildLocalFileHeader(
  filename: string,
  data: Buffer,
  compressionMethod: number,
): Buffer {
  const filenameBuf = Buffer.from(filename, "utf8");
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0); // signature
  header.writeUInt16LE(20, 4); // version
  header.writeUInt16LE(0, 6); // flags
  header.writeUInt16LE(compressionMethod, 8); // compression
  header.writeUInt16LE(0, 10); // mod time
  header.writeUInt16LE(0, 12); // mod date
  header.writeUInt32LE(0, 14); // crc32
  header.writeUInt32LE(data.length, 18); // compressed size
  header.writeUInt32LE(data.length, 22); // uncompressed size
  header.writeUInt16LE(filenameBuf.length, 26); // filename length
  header.writeUInt16LE(0, 28); // extra field length

  return Buffer.concat([header, filenameBuf, data]);
}

describe("extractSrtFromZip", () => {
  it("extracts a stored .srt file (compression method 0)", async () => {
    const srtContent = "1\n00:00:01,000 --> 00:00:02,000\nHello\n";
    const data = Buffer.from(srtContent, "utf8");
    const zip = buildLocalFileHeader("subtitle.srt", data, 0);

    const result = await extractSrtFromZip(zip);

    expect(result).toBe(srtContent);
  });

  it("extracts a deflate-compressed .srt file (compression method 8)", async () => {
    const srtContent = "1\n00:00:01,000 --> 00:00:02,000\nDeflated\n";
    const compressed = await deflateRawAsync(Buffer.from(srtContent, "utf8"));
    const zip = buildLocalFileHeader("subtitle.srt", compressed, 8);

    const result = await extractSrtFromZip(zip);

    expect(result).toBe(srtContent);
  });

  it("skips non-.srt files and returns the first .srt", async () => {
    const txtData = Buffer.from("not a subtitle", "utf8");
    const srtContent = "1\n00:00:01,000 --> 00:00:02,000\nFound it\n";
    const srtData = Buffer.from(srtContent, "utf8");

    const zip = Buffer.concat([
      buildLocalFileHeader("readme.txt", txtData, 0),
      buildLocalFileHeader("subtitle.srt", srtData, 0),
    ]);

    const result = await extractSrtFromZip(zip);

    expect(result).toBe(srtContent);
  });

  it("returns undefined when no .srt file is present", async () => {
    const txtData = Buffer.from("no srt here", "utf8");
    const zip = buildLocalFileHeader("readme.txt", txtData, 0);

    const result = await extractSrtFromZip(zip);

    expect(result).toBeUndefined();
  });

  it("returns undefined for an empty buffer", async () => {
    const result = await extractSrtFromZip(Buffer.alloc(0));

    expect(result).toBeUndefined();
  });
});
