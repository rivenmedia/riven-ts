import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { logger } from "#utilities/logger/logger.ts";

import { validateTorrentFiles } from "../utilities/validate-torrent-files.ts";
import {
  acceptedBitrateCases,
  fileSizeForBitrate,
  rejectedBitrateCases,
} from "./helpers/bitrate-test-cases.ts";

import type { MapItemsToFilesSandboxedJob } from "#message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";
import type { BitrateCase } from "./helpers/bitrate-test-cases.ts";
import type { Episode } from "@repo/util-plugin-sdk/dto/entities";

type MappedFiles = MapItemsToFilesSandboxedJob["output"];

const runtime = 30;

const it = baseIt
  .extend("spyOnLoggerDebug", () => () => vi.spyOn(logger, "debug"))
  .extend(
    "buildEpisodeFiles",
    () =>
      async function buildEpisodeFiles(
        episodes: Episode[],
        getBitrate: (episode: Episode) => number,
      ) {
        const files: MappedFiles["episodes"] = {};

        for (const episode of episodes) {
          const show = await episode.getShow();
          const seasonNumber = await episode.season.loadProperty("number");
          const name = `${show.title}.S${seasonNumber.toString().padStart(2, "0")}E${episode.number.toString().padStart(2, "0")}.1080p.WEB-DL.mkv`;

          files[`abs:${episode.absoluteNumber.toString()}`] = {
            name,
            path: `/${name}`,
            size: fileSizeForBitrate(getBitrate(episode), runtime),
            link: "http://example.com/file.mkv",
          };
        }

        return files;
      },
  )
  .extend(
    "mockBitrateSettings",
    ({ overrideRuntimeSettings }) =>
      ({ minimum, maximum }: Pick<BitrateCase, "minimum" | "maximum">) => {
        overrideRuntimeSettings({
          general: {
            scraping: {
              minimumAverageBitrateEpisodes: minimum,
              maximumAverageBitrateEpisodes: maximum,
            },
          },
        });
      },
  );

it.beforeAll(({ gqlServer: _gqlServer }) => undefined);

it.for(rejectedBitrateCases)(
  "rejects a file $label",
  async (
    { minimum, maximum, bitrate, reason },
    {
      spyOnLoggerDebug,
      buildEpisodeFiles,
      em,
      episode,
      mockBitrateSettings,
      stream,
    },
  ) => {
    episode.runtime = runtime;

    await em.persist(episode).flush();

    mockBitrateSettings({ minimum, maximum });

    const debugSpy = spyOnLoggerDebug();

    const mappedFiles = {
      movies: {},
      episodes: await buildEpisodeFiles([episode], () => bitrate),
    } satisfies MappedFiles;

    await expect(
      validateTorrentFiles(episode.id, stream.infoHash, mappedFiles, false),
    ).rejects.toThrow("Expected at least 1 valid files, but found 0");

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `File bitrate is ${bitrate.toString()}, ${reason} for episodes`,
      ),
    );
  },
);

it.for(acceptedBitrateCases)(
  "accepts a file $label",
  async (
    { minimum, maximum, bitrate },
    { buildEpisodeFiles, em, episode, mockBitrateSettings, stream },
  ) => {
    episode.runtime = runtime;

    await em.persist(episode).flush();

    mockBitrateSettings({ minimum, maximum });

    const mappedFiles = {
      movies: {},
      episodes: await buildEpisodeFiles([episode], () => bitrate),
    } satisfies MappedFiles;

    await expect(
      validateTorrentFiles(episode.id, stream.infoHash, mappedFiles, false),
    ).resolves.toStrictEqual([
      expect.objectContaining({ matchedMediaItemId: episode.id }),
    ]);
  },
);

it("skips the bitrate check if the episode has no runtime", async ({
  buildEpisodeFiles,
  em,
  episode,
  mockBitrateSettings,
  stream,
}) => {
  episode.runtime = null;

  await em.persist(episode).flush();

  mockBitrateSettings({ minimum: 5000, maximum: 15_000 });

  const mappedFiles = {
    movies: {},
    episodes: await buildEpisodeFiles([episode], () => 1_000_000),
  } satisfies MappedFiles;

  await expect(
    validateTorrentFiles(episode.id, stream.infoHash, mappedFiles, false),
  ).resolves.toHaveLength(1);
});

it.for(["show", "season"] as const)(
  "rejects only the episodes outside the configured range in a %s pack",
  async (
    type,
    {
      buildEpisodeFiles,
      em,
      indexedShowContext: {
        indexedShow,
        seasons: [season],
        episodes: showEpisodes,
      },
      mockBitrateSettings,
      stream,
    },
  ) => {
    expect.assert(season);

    const item = type === "show" ? indexedShow : season;
    const episodes =
      type === "show" ? showEpisodes : season.episodes.getItems();

    for (const episode of episodes) {
      episode.runtime = runtime;
    }

    await em.persist(episodes).flush();

    mockBitrateSettings({ minimum: 5000, maximum: 15_000 });

    const [tooLow, tooHigh] = episodes;

    expect.assert(tooLow && tooHigh);

    const mappedFiles = {
      movies: {},
      episodes: await buildEpisodeFiles(episodes, (episode) => {
        if (episode === tooLow) {
          return 4999;
        }

        if (episode === tooHigh) {
          return 15_001;
        }

        return 10_000;
      }),
    } satisfies MappedFiles;

    await expect(
      validateTorrentFiles(item.id, stream.infoHash, mappedFiles, false),
    ).rejects.toThrow(
      `Expected at least ${episodes.length.toString()} valid files, but found ${(episodes.length - 2).toString()}`,
    );
  },
);
