import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";
import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
  createRankingModel,
} from "@repo/util-rank-torrent-name";

import { UnrecoverableError } from "bullmq";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { sortScrapeResultsProcessorSchema } from "./sort-scrape-results.schema.ts";
import {
  SkippedTorrentError,
  validateTorrent,
} from "./utilities/validate-torrent.ts";

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
  sortScrapeResultsProcessorSchema.implementAsync(async function ({ job }) {
    const children = await job.getChildrenValues();

    const childResults = Object.values(children);

    // Aggregate results from all scrapers, deduping by hash (which should be consistent across scrapers)
    const aggregatedResults = childResults.reduce<Record<string, string>>(
      (acc, scrapeResult) => ({
        ...acc,
        ...scrapeResult.results,
      }),
      {},
    );

    const item = await database.mediaItem.findOneOrFail(job.data.id);
    const itemTitle =
      item instanceof Episode || item instanceof Season
        ? (await item.getShow()).title
        : item.title;

    if (!Object.keys(aggregatedResults).length) {
      throw new UnrecoverableError(`No streams found for ${itemTitle}`);
    }

    const parsedResults = await Object.entries(aggregatedResults).reduce<
      Promise<RankedResult[]>
    >(async (acc, [hash, rawTitle]) => {
      const results = await acc;

      try {
        const torrent = rtnInstance.rankTorrent(rawTitle, hash, itemTitle);

        await validateTorrent(item, itemTitle, torrent);

        return [...results, torrent];
      } catch (error) {
        if (
          error instanceof GarbageTorrentError ||
          error instanceof SkippedTorrentError
        ) {
          logger.silly(error.message);
        } else {
          logger.error(
            `Failed to rank torrent ${rawTitle} (${hash}) for ${itemTitle}: ${
              (error as Error).message
            }`,
          );
        }

        return results;
      }
    }, Promise.resolve([]));

    return {
      id: job.data.id,
      title: itemTitle,
      results: rtnInstance.sortTorrents(parsedResults),
    };
  });
