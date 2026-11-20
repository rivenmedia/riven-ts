import { expect, it } from "vitest";

import { createZip } from "../../__tests__/helpers/create-zip.ts";
import { extractSrtFromZip } from "../extract-srt-from-zip.ts";

const SUBTITLE = "1\n00:00:01,000 --> 00:00:02,000\nHello, wörld\n";

it("extracts an uncompressed subtitle", async () => {
  await expect(
    extractSrtFromZip(
      await createZip([{ filename: "movie.srt", content: SUBTITLE }]),
    ),
  ).resolves.toBe(SUBTITLE);
});

it("extracts a deflated subtitle", async () => {
  await expect(
    extractSrtFromZip(
      await createZip([
        { filename: "movie.srt", content: SUBTITLE, compressionMethod: 8 },
      ]),
    ),
  ).resolves.toBe(SUBTITLE);
});

it("extracts the first subtitle after skipping other files", async () => {
  await expect(
    extractSrtFromZip(
      await createZip([
        {
          filename: "readme.txt",
          content: "Not a subtitle",
          compressionMethod: 8,
        },
        {
          filename: "folder/movie.srt",
          content: SUBTITLE,
          extraField: Buffer.from("extra-field"),
        },
        { filename: "movie.forced.srt", content: "Second subtitle" },
      ]),
    ),
  ).resolves.toBe(SUBTITLE);
});

it("skips subtitles with an unsupported compression method", async () => {
  await expect(
    extractSrtFromZip(
      await createZip([
        { filename: "bzip2.srt", content: "Unreadable", compressionMethod: 12 },
        { filename: "movie.srt", content: SUBTITLE },
      ]),
    ),
  ).resolves.toBe(SUBTITLE);
});

it("returns nothing when the archive has no subtitle", async () => {
  await expect(
    extractSrtFromZip(
      await createZip([
        { filename: "movie.sub", content: SUBTITLE },
        { filename: "srt", content: SUBTITLE },
      ]),
    ),
  ).resolves.toBeUndefined();
});

it("returns nothing for data that is not a ZIP archive", async () => {
  await expect(
    extractSrtFromZip(Buffer.from(SUBTITLE, "utf8")),
  ).resolves.toBeUndefined();
});
