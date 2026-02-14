import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
  createRankingModel,
} from "@repo/util-rank-torrent-name";

import { UnrecoverableError } from "bullmq";

import { logger } from "../../../../utilities/logger/logger.ts";
import { sortScrapeResultsProcessorSchema } from "./sort-scrape-results.schema.ts";

const rtnInstance = new RTN(
  {
    exclude: ["\\bmatte\\b"],
    preferred: ["\\b4[Kk]|2160p?\\b", "HDR|HDR10"],
    resolutions: {
      r2160p: true,
      r720p: true,
      r480p: true,
    },
    languages: {
      preferred: ["anime"],
    },
    customRanks: {
      quality: {
        av1: { fetch: true },
        remux: { fetch: true },
      },
      rips: {
        bdrip: { fetch: true },
        dvdrip: { fetch: true },
        tvrip: { fetch: true },
        uhdrip: { fetch: true },
        webdlrip: { fetch: true },
      },
      hdr: {
        dolbyVision: { fetch: true },
      },
      extras: {
        documentary: { fetch: true },
        site: { fetch: true },
      },
    },
  },
  createRankingModel({
    av1: 0,
    bluray: 500,
    hdtv: 500,
    hevc: 500,
    mpeg: 0,
    remux: 1250,
    web: 150,
    webdl: 1500,
    bdrip: 1000,
    brrip: 0,
    dvdrip: 100,
    hdrip: 0,
    tvrip: 0,
    uhdrip: 0,
    webdlrip: 50,
    webrip: 50,
    bit10: 2750,
    dolbyVision: 3000,
    hdr: 2700,
    hdr10plus: 2800,
    sdr: 2300,
    aac: 1450,
    atmos: 1500,
    dolbyDigital: 1450,
    dolbyDigitalPlus: 1450,
    dtsLossy: 1000,
    dtsLossless: 1450,
    flac: 1100,
    stereo: 1050,
    surround: 1050,
    truehd: 1450,
    documentary: 0,
    edition: 80,
    hardcoded: 50,
    network: 100,
    proper: 300,
    repack: 300,
    retail: 0,
    site: 0,
    subbed: 30,
    scene: 0,
    uncensored: 0,
  }),
);

export const sortScrapeResultsProcessor =
  sortScrapeResultsProcessorSchema.implementAsync(async function (job) {
    const children = await job.getChildrenValues();

    const childResults = Object.values(children);

    const aggregatedResults = childResults.reduce<Record<string, string>>(
      (acc, scrapeResult) => ({
        ...acc,
        ...scrapeResult.results,
      }),
      {},
    );

    if (!Object.keys(aggregatedResults).length) {
      throw new UnrecoverableError(`No streams found for ${job.data.title}`);
    }

    const parsedResults = Object.entries(aggregatedResults).reduce<
      RankedResult[]
    >((acc, [hash, rawTitle]) => {
      try {
        return [
          ...acc,
          rtnInstance.rankTorrent(rawTitle, hash, job.data.title),
        ];
      } catch (error) {
        if (error instanceof GarbageTorrentError) {
          logger.silly(error.message);
        } else {
          logger.error(
            `Failed to rank torrent ${rawTitle} (${hash}) for ${job.data.title}: ${
              (error as Error).message
            }`,
          );
        }

        return acc;
      }
    }, []);

    return {
      success: true,
      result: {
        id: job.data.id,
        results: rtnInstance.sortTorrents(parsedResults),
      },
    };
  });
