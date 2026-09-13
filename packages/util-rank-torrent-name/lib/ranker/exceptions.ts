import { prettifyError } from "zod";

import type { ZodError } from "zod";

export class GarbageTorrentError extends Error {
  public constructor(title: string, message: string) {
    super(`Garbage torrent detected for "${title}": ${message}`);

    this.name = "GarbageTorrentError";
  }
}

export class TitleSimilarityError extends GarbageTorrentError {
  public constructor(
    title: string,
    parsedTitle: string,
    expectedTitle: string,
  ) {
    super(
      title,
      `${parsedTitle} does not match the correct title: ${expectedTitle}`,
    );

    this.name = "TitleSimilarityError";
  }
}

export class InvalidHashError extends GarbageTorrentError {
  public constructor(title: string, error: ZodError) {
    super(title, prettifyError(error));

    this.name = "InvalidHashError";
  }
}

export class FetchChecksFailedError extends GarbageTorrentError {
  public constructor(title: string, reasons: Set<string>) {
    super(title, `Failed fetch checks: ${[...reasons].join(", ")}`);

    this.name = "FetchChecksFailedError";
  }
}

export class RankUnderThresholdError extends GarbageTorrentError {
  public constructor(title: string, rank: number, threshold: number) {
    super(
      title,
      `Rank ${rank.toString()} is below the threshold of ${threshold.toString()}`,
    );

    this.name = "RankUnderThresholdError";
  }
}
