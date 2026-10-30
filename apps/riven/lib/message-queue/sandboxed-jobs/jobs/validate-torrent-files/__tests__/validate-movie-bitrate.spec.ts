import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { logger } from "#utilities/logger/logger.ts";
import * as settingsModule from "#utilities/settings.ts";

import { validateTorrentFiles } from "../utilities/validate-torrent-files.ts";
import {
  acceptedBitrateCases,
  fileSizeForBitrate,
  rejectedBitrateCases,
} from "./helpers/bitrate-test-cases.ts";

import type { MapItemsToFilesSandboxedJob } from "#message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";
import type { BitrateCase } from "./helpers/bitrate-test-cases.ts";

type MappedFiles = MapItemsToFilesSandboxedJob["output"];

function mockBitrateSettings({
  minimum,
  maximum,
}: Pick<BitrateCase, "minimum" | "maximum">) {
  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    minimumAverageBitrateMovies: minimum,
    maximumAverageBitrateMovies: maximum,
  });
}

it.beforeAll(({ gqlServer: _gqlServer }) => undefined);

const runtime = 120;

function buildMovieFile(title: string, bitrate: number) {
  const name = `${title}.${bitrate.toString()}kbps.2024.1080p.WEB-DL.mkv`;

  return {
    name,
    path: `/${name}`,
    size: fileSizeForBitrate(bitrate, runtime),
    link: "http://example.com/file.mkv",
  };
}

it.for(rejectedBitrateCases)(
  "rejects a file $label",
  async (
    { minimum, maximum, bitrate, reason },
    { em, indexedMovieContext: { indexedMovie }, stream },
  ) => {
    indexedMovie.runtime = runtime;

    await em.persist(indexedMovie).flush();

    mockBitrateSettings({ minimum, maximum });

    const debugSpy = vi.spyOn(logger, "debug");

    const mappedFiles = {
      movies: { 0: buildMovieFile(indexedMovie.title, bitrate) },
      episodes: {},
    } satisfies MappedFiles;

    await expect(
      validateTorrentFiles(
        indexedMovie.id,
        stream.infoHash,
        mappedFiles,
        false,
      ),
    ).rejects.toThrow("Expected at least 1 valid files, but found 0");

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `File bitrate is ${bitrate.toString()}, ${reason} for movies`,
      ),
    );
  },
);

it.for(acceptedBitrateCases)(
  "accepts a file $label",
  async (
    { minimum, maximum, bitrate },
    { em, indexedMovieContext: { indexedMovie }, stream },
  ) => {
    indexedMovie.runtime = runtime;

    await em.persist(indexedMovie).flush();

    mockBitrateSettings({ minimum, maximum });

    const file = buildMovieFile(indexedMovie.title, bitrate);

    const mappedFiles = {
      movies: { 0: file },
      episodes: {},
    } satisfies MappedFiles;

    await expect(
      validateTorrentFiles(
        indexedMovie.id,
        stream.infoHash,
        mappedFiles,
        false,
      ),
    ).resolves.toStrictEqual([expect.objectContaining({ name: file.name })]);
  },
);

it("falls back to a smaller file when the largest file exceeds the maximum", async ({
  em,
  indexedMovieContext: { indexedMovie },
  stream,
}) => {
  indexedMovie.runtime = runtime;

  await em.persist(indexedMovie).flush();

  mockBitrateSettings({ maximum: 60 });

  const largeFile = buildMovieFile(indexedMovie.title, 70);
  const smallFile = buildMovieFile(indexedMovie.title, 50);

  const mappedFiles = {
    movies: { 0: largeFile, 1: smallFile },
    episodes: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedMovie.id, stream.infoHash, mappedFiles, false),
  ).resolves.toStrictEqual([expect.objectContaining({ name: smallFile.name })]);
});

it("skips the bitrate check if the movie has no runtime", async ({
  em,
  indexedMovieContext: { indexedMovie },
  stream,
}) => {
  indexedMovie.runtime = null;

  await em.persist(indexedMovie).flush();

  mockBitrateSettings({ minimum: 40, maximum: 60 });

  const mappedFiles = {
    movies: { 0: buildMovieFile(indexedMovie.title, 1000) },
    episodes: {},
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(indexedMovie.id, stream.infoHash, mappedFiles, false),
  ).resolves.toHaveLength(1);
});
