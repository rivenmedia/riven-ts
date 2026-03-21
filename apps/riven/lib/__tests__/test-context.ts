/* eslint-disable no-empty-pattern */
import {
  Episode,
  ItemRequest,
  MediaEntry,
  Movie,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";
import { parse } from "@repo/util-rank-torrent-name";

import { ApolloServer } from "@apollo/server";
import { DateTime } from "luxon";
import { MockAgent, setGlobalDispatcher } from "undici";
import { expect, test as testBase } from "vitest";

import { database } from "../database/database.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { SetupServerApi } from "msw/node";

export const rivenTestContext = testBase.extend<{
  server: SetupServerApi;
  apolloServerInstance: ApolloServer;
  gqlServer: ApolloServer;
  mockAgent: MockAgent;
  em: EntityManager;
  movie: Movie;
  show: Show;
  season: Season;
  episode: Episode;
  stream: Stream;
  mediaEntry: MediaEntry;
}>({
  async apolloServerInstance({}, use) {
    const { buildMockServer } =
      await import("@repo/core-util-mock-graphql-server");

    const mockServer = await buildMockServer();

    await use(mockServer);
  },
  async gqlServer({ apolloServerInstance }, use) {
    await apolloServerInstance.start();

    await use(apolloServerInstance);

    await apolloServerInstance.stop();
  },
  server: async ({}, use) => {
    const { setupServer } = await import("msw/node");

    const server = setupServer();

    if (/^(\*|msw)/.test(process.env["DEBUG"] ?? "")) {
      server.events.on("response:mocked", ({ request, response }) => {
        console.log(
          "%s %s received %s %s",
          request.method,
          request.url,
          response.status,
          response.statusText,
        );
      });
    }

    // Start the worker before the test.
    server.listen({
      onUnhandledRequest: "error",
    });

    // Expose the worker object on the test's context.
    await use(server);

    // Remove any request handlers added in individual test cases.
    // This prevents them from affecting unrelated tests.
    server.resetHandlers();

    // Stop the worker after the test.
    server.close();
  },
  mockAgent: async ({}, use) => {
    const mockAgent = new MockAgent();

    mockAgent.disableNetConnect();

    setGlobalDispatcher(mockAgent);

    await use(mockAgent);

    await mockAgent.close();
  },
  em: async ({}, use) => {
    const em = database.em.fork();

    await use(em);
  },
  movie: async ({ em }, use) => {
    const itemRequest = em.create(ItemRequest, {
      requestedBy: "@repo/plugin-test",
      state: "completed",
      type: "movie",
    });

    const movie = em.create(Movie, {
      title: "Test Movie",
      contentRating: "g",
      tmdbId: "1",
      itemRequest,
      isRequested: true,
      releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
    });

    await em.flush();

    await use(movie);
  },
  show: async ({ em }, use) => {
    const itemRequest = em.create(ItemRequest, {
      requestedBy: "@repo/plugin-test",
      state: "completed",
      type: "show",
    });

    const show = em.create(Show, {
      title: "Test Show",
      contentRating: "tv-14",
      status: "ended",
      tvdbId: "1",
      itemRequest,
      isRequested: true,
      keepUpdated: false,
      releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
    });

    await em.flush();

    let absoluteEpisodeNumber = 1;

    for (let seasonNumber = 1; seasonNumber <= 6; seasonNumber++) {
      const season = em.create(Season, {
        tvdbId: show.tvdbId,
        title: `Season ${seasonNumber.toString()}`,
        number: seasonNumber,
        isSpecial: false,
        isRequested: true,
        itemRequest,
        releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
      });

      show.seasons.add(season);

      await em.flush();

      for (let episodeNumber = 1; episodeNumber <= 10; episodeNumber++) {
        const episode = em.create(Episode, {
          tvdbId: show.tvdbId,
          title: `Episode ${episodeNumber.toString().padStart(2, "0")}`,
          contentRating: "tv-14",
          number: episodeNumber,
          absoluteNumber: absoluteEpisodeNumber++,
          isSpecial: false,
          isRequested: true,
          itemRequest,
          releaseDate: DateTime.now().minus({ years: 1 }).toISO(),
        });

        season.episodes.add(episode);
      }

      show.seasons.add(season);
    }

    await em.flush();

    await use(show);
  },
  season: async ({ show }, use) => {
    expect.assert(show.seasons[0]);

    await use(show.seasons[0]);
  },
  episode: async ({ season }, use) => {
    expect.assert(season.episodes[0]);

    await use(season.episodes[0]);
  },
  stream: async ({ em }, use) => {
    const stream = em.create(Stream, {
      infoHash: "1234567890abcdef1234567890abcdef12345678",
      parsedData: parse("Example.Movie.2024.1080p.BluRay.x264-GROUP"),
    });

    await em.flush();

    await use(stream);
  },
  mediaEntry: async ({ em }, use) => {
    const mediaEntry = em.create(MediaEntry, {
      fileSize: 1024,
      downloadUrl: "http://example.com/file.mp4",
      originalFilename: "file.mp4",
      plugin: "@repo/plugin-test",
    });

    await use(mediaEntry);
  },
});
