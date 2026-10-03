import { transforms } from "@viren070/parse-torrent-title";

import type { Handler } from "@viren070/parse-torrent-title";

/**
 * Matches web releases with a resolution, e.g. `Show.S01E01.1080p.WEB.H264-GROUP`
 */
const sceneWebReleasePattern = String.raw`^(?=.*\b\d{3,4}p\b.*[_. ]WEB[_. ](?!DL)\b)`;

/**
 * Release groups that are known to publish scene releases
 */
const sceneReleaseGroups = new Set([
  "CAKES",
  "GGEZ",
  "GGWP",
  "GLHF",
  "GOSSIP",
  "NAISU",
  "KOGI",
  "PECULATE",
  "SLOT",
  "EDITH",
  "ETHEL",
  "ELEANOR",
  "B2B",
  "SPAMnEGGS",
  "FTP",
  "DiRT",
  "SYNCOPY",
  "BAE",
  "SuccessfulCrab",
  "NHTFS",
  "SURCODE",
  "B0MBARDIERS",
]);

const sceneReleaseGroupPattern = String.raw`\b-(?:${[...sceneReleaseGroups].join("|")})`;

export const sceneHandlers: Handler[] = [
  {
    field: "scene",
    pattern: new RegExp(
      `(?:${sceneWebReleasePattern})|(?:${sceneReleaseGroupPattern})`,
      "iu",
    ),
    transform: transforms.toBoolean(),
  },
];
