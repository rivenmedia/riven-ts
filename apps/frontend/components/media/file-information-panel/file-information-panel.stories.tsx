import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";
import { fn } from "storybook/test";

import { FileInformationPanel } from "./file-information-panel";

const meta = preview.meta({
  title: "Media / FileInformationPanel",
  component: FileInformationPanel,
});

export const Default = meta.story({
  args: {
    fallbackMediaMetadata: {},
    onDeleteEntry: fn(),
    entries: [
      {
        fileSize: {
          size: 14.4,
          units: "GiB",
        },
        createdAt: DateTime.now().toISO(),
        id: "1",
        originalFilename:
          "John.Wick.Chapter.4.2023.2160p.UHD.BluRay.REMUX.HDR.HEVC.DTS-HD.MA.7.1.mkv",
        plugin: "@repo/plugin-stremthru",
        provider: "realdebrid",
        type: "media",
        __typename: "MediaEntry",
        mediaMetadata: {
          fileName:
            "John.Wick.Chapter.4.2023.2160p.UHD.BluRay.REMUX.HDR.HEVC.DTS-HD.MA.7.1.mkv",
          duration: 8520,
          bitRate: 45_000_000,
          video: {
            resolution: {
              width: 3840,
              height: 2160,
            },
            codec: "HEVC",
            bitDepth: 10,
            hdrType: "HDR10",
            frameRate: 23.976,
          },
          audioTracks: [{ codec: "TrueHD", channels: 8, language: "en" }],
          subtitleTracks: [{ language: "en" }, { language: "fr" }],
          qualitySource: "BluRay",
          isRemux: true,
          containerFormat: ["mkv"],
        },
      },
    ],
  },
});
