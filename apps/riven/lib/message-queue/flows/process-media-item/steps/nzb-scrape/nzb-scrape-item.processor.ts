import { Season } from "@repo/util-plugin-sdk/dto/entities";

import { UnrecoverableError } from "bullmq";
import chalk from "chalk";

import { nzbScrapeItemProcessorSchema } from "./nzb-scrape-item.schema.ts";
import {
  pickNewestCandidate,
  pickSeasonPackCandidate,
} from "./pick-nzb-candidate.ts";

/**
 * Aggregates NZB candidates from all nzb-scrape plugin child jobs, picks the
 * newest candidate (via the pure pickNewestCandidate helper) and returns it
 * so the parent process-media-item flow can enqueue nzb-download.
 *
 * On zero candidates, emits `riven.media-item.nzb-scrape.error` with
 * reason="no-new-streams" and throws an UnrecoverableError so the flow step
 * is marked as ignored (continueParentOnFailure=true) rather than retried.
 */
export const nzbScrapeItemProcessor =
  nzbScrapeItemProcessorSchema.implementAsync(async function (
    { job },
    { sendEvent, services: { mediaItemService } },
  ) {
    const children = await job.getChildrenValues();

    // Aggregate candidates from all plugin child jobs.
    const allCandidates = Object.values(children).flatMap(
      (result) => result.candidates,
    );

    const item = await mediaItemService.getMediaItemById(job.data.id);

    // A season-level scrape returns both season packs and individual episodes.
    // Prefer a full-season pack (1 grab covers the whole season); if none, the
    // undefined result below fans the season out to per-episode scrapes. Every
    // other item type (movie/episode) keeps the newest-wins selection.
    const chosen =
      item instanceof Season
        ? pickSeasonPackCandidate(allCandidates, item.number)
        : pickNewestCandidate(allCandidates);

    if (chosen === undefined) {
      sendEvent({
        type: "riven.media-item.nzb-scrape.error",
        itemId: item.id,
        reason: "no-new-streams",
        detail: `No NZB candidates returned for ${chalk.bold(item.fullTitle)}`,
      });

      throw new UnrecoverableError(
        `No NZB candidates found for ${chalk.bold(item.fullTitle)}`,
      );
    }

    sendEvent({
      type: "riven.media-item.nzb-scrape.success",
      itemId: item.id,
      candidateCount: allCandidates.length,
    });

    return {
      chosen,
      item: {
        id: item.id,
        title: item.title,
        imdbId: item.imdbId,
        type: item.type,
      },
    };
  });
