import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities/index";
import {
  GarbageTorrentError,
  RTN,
  type RankedResult,
  createRankingModel,
} from "@repo/util-rank-torrent-name";

import { wrap } from "@mikro-orm/core";
import { UnrecoverableError } from "bullmq";

import { database } from "../../../../../database/database.ts";
import { logger } from "../../../../../utilities/logger/logger.ts";
import { settings } from "../../../../../utilities/settings.ts";
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

class SkippedTorrentError extends Error {
  constructor(
    message: string,
    itemTitle: string,
    torrentTitle: string,
    torrentHash: string,
  ) {
    super(`[${itemTitle} | ${torrentTitle}]: ${message} (${torrentHash})`);

    this.name = "SkippedTorrentError";
  }
}

export const sortScrapeResultsProcessor =
  sortScrapeResultsProcessorSchema.implementAsync(async function (job) {
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

    if (!Object.keys(aggregatedResults).length) {
      throw new UnrecoverableError(`No streams found for ${job.data.title}`);
    }

    const item = await database.mediaItem.findOneOrFail(job.data.id);

    const parsedResults = await Object.entries(aggregatedResults).reduce<
      Promise<RankedResult[]>
    >(async (acc, [hash, rawTitle]) => {
      const results = await acc;

      try {
        const torrent = rtnInstance.rankTorrent(rawTitle, hash, job.data.title);

        if (item instanceof Movie) {
          if (torrent.data.seasons.length || torrent.data.episodes.length) {
            throw new SkippedTorrentError(
              `Skipping show torrent for movie`,
              job.data.title,
              rawTitle,
              hash,
            );
          }
        }

        if (item instanceof Show) {
          if (torrent.data.episodes.length <= 2) {
            throw new SkippedTorrentError(
              "Skipping torrent with 2 or fewer episodes for show",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          await wrap(item).populate(["seasons"]);

          const seasonsIntersection = new Set(
            torrent.data.seasons,
          ).intersection(new Set(item.seasons.map((season) => season.number)));

          if (seasonsIntersection.size !== item.seasons.length) {
            throw new SkippedTorrentError(
              "Skipping torrent with incorrect number of seasons",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          await wrap(item).populate(["seasons.episodes"]);

          const episodesIntersection = new Set(
            torrent.data.episodes,
          ).intersection(
            new Set(
              item.seasons
                .getItems()
                .flatMap((season) =>
                  season.episodes.map((episode) => episode.absoluteNumber),
                ),
            ),
          );

          const totalEpisodes = item.seasons.reduce(
            (acc, season) => acc + season.episodes.length,
            0,
          );

          if (
            torrent.data.episodes.length &&
            episodesIntersection.size !== totalEpisodes
          ) {
            throw new SkippedTorrentError(
              "Skipping torrent with incorrect number of episodes for show",
              job.data.title,
              rawTitle,
              hash,
            );
          }
        }

        if (item instanceof Season) {
          if (!torrent.data.seasons.length) {
            throw new SkippedTorrentError(
              "Skipping torrent with no seasons for season item",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          if (!torrent.data.seasons.includes(item.number)) {
            throw new SkippedTorrentError(
              "Skipping torrent with incorrect season number for season item",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          if (torrent.data.episodes.length <= 2) {
            throw new SkippedTorrentError(
              "Skipping torrent with 2 or fewer episodes for season item",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          await wrap(item).populate(["episodes"]);

          const episodesIntersection = new Set(
            torrent.data.episodes,
          ).intersection(
            new Set(item.episodes.map((episode) => episode.absoluteNumber)),
          );

          if (episodesIntersection.size !== item.episodes.length) {
            throw new SkippedTorrentError(
              "Skipping torrent with incorrect episodes for season item",
              job.data.title,
              rawTitle,
              hash,
            );
          }
        }

        if (item instanceof Episode) {
          await wrap(item).populate(["season"]);

          const episodesIntersection = new Set(
            torrent.data.episodes,
          ).intersection(new Set([item.number, item.absoluteNumber]));

          const hasEpisodes = torrent.data.episodes.length > 0;
          const hasSeasons = torrent.data.seasons.length > 0;

          if (hasEpisodes && episodesIntersection.size === 0) {
            throw new SkippedTorrentError(
              "Skipping torrent with incorrect episode number for episode item",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          if (
            hasSeasons &&
            !torrent.data.seasons.includes(item.season.getProperty("number"))
          ) {
            throw new SkippedTorrentError(
              "Skipping torrent with incorrect season number for episode item",
              job.data.title,
              rawTitle,
              hash,
            );
          }

          if (!hasEpisodes && !hasSeasons) {
            throw new SkippedTorrentError(
              "Skipping torrent with no season or episode data for episode item",
              job.data.title,
              rawTitle,
              hash,
            );
          }
        }

        if (
          torrent.data.country &&
          item.country &&
          torrent.data.country !== item.country &&
          !item.isAnime
        ) {
          throw new SkippedTorrentError(
            "Skipping torrent with incorrect country",
            job.data.title,
            rawTitle,
            hash,
          );
        }

        if (
          torrent.data.year &&
          item.year &&
          ![item.year - 1, item.year, item.year + 1].includes(torrent.data.year)
        ) {
          throw new SkippedTorrentError(
            "Skipping torrent with incorrect year",
            job.data.title,
            rawTitle,
            hash,
          );
        }

        if (item.isAnime && settings.dubbedAnimeOnly && !torrent.data.dubbed) {
          throw new SkippedTorrentError(
            "Skipping non-dubbed anime torrent",
            job.data.title,
            rawTitle,
            hash,
          );
        }

        return [...results, torrent];
      } catch (error) {
        if (
          error instanceof GarbageTorrentError ||
          error instanceof SkippedTorrentError
        ) {
          logger.silly(error.message);
        } else {
          logger.error(
            `Failed to rank torrent ${rawTitle} (${hash}) for ${job.data.title}: ${
              (error as Error).message
            }`,
          );
        }

        return results;
      }
    }, Promise.resolve([]));

    return {
      success: true,
      result: {
        id: job.data.id,
        results: rtnInstance.sortTorrents(parsedResults),
      },
    };
  });
