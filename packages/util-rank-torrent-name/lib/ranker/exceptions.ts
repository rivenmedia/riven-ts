import { type ZodError, prettifyError } from "zod";

export class GarbageTorrentError extends Error {
  constructor(title: string, message: string) {
    super(`Garbage torrent detected for "${title}": ${message}`);

    this.name = "GarbageTorrentError";
  }
}

export class TitleSimilarityError extends GarbageTorrentError {
  constructor(title: string, error: ZodError) {
    super(title, prettifyError(error));

    this.name = "TitleSimilarityError";
  }
}

export class InvalidHashError extends GarbageTorrentError {
  constructor(title: string, error: ZodError) {
    super(title, prettifyError(error));

    this.name = "InvalidHashError";
  }
}

export class FetchChecksFailedError extends GarbageTorrentError {
  constructor(title: string, reasons: Set<string>) {
    super(title, `Failed fetch checks: ${[...reasons].join(", ")}`);

    this.name = "FetchChecksFailedError";
  }
}

export class RankUnderThresholdError extends GarbageTorrentError {
  constructor(title: string, rank: number, threshold: number) {
    super(
      title,
      `Rank ${rank.toString()} is below the threshold of ${threshold.toString()}`,
    );

    this.name = "RankUnderThresholdError";
  }
}
