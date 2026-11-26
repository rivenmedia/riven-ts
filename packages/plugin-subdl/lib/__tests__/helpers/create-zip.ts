import { promisify } from "node:util";
import { deflateRaw } from "node:zlib";

const deflateRawAsync = promisify(deflateRaw);

export interface ZipEntry {
  filename: string;
  content: string;
  compressionMethod?: number;
  extraField?: Buffer;
}

/**
 * Builds a ZIP archive from local file headers, which is all the subtitle extraction reads.
 */
export async function createZip(entries: ZipEntry[]) {
  const parts = await Promise.all(
    entries.map(
      async ({
        filename,
        content,
        compressionMethod = 0,
        extraField = Buffer.alloc(0),
      }) => {
        const uncompressed = Buffer.from(content, "utf8");
        const data =
          compressionMethod === 8
            ? await deflateRawAsync(uncompressed)
            : uncompressed;
        const name = Buffer.from(filename, "utf8");
        const header = Buffer.alloc(30);

        header.writeUInt32LE(0x04_03_4b_50, 0);
        header.writeUInt16LE(20, 4);
        header.writeUInt16LE(compressionMethod, 8);
        header.writeUInt32LE(data.length, 18);
        header.writeUInt32LE(uncompressed.length, 22);
        header.writeUInt16LE(name.length, 26);
        header.writeUInt16LE(extraField.length, 28);

        return [header, name, extraField, data];
      },
    ),
  );

  return Buffer.concat(parts.flat());
}
