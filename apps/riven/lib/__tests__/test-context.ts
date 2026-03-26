/* eslint-disable no-empty-pattern */
import {
  Episode,
  MediaEntry,
  Movie,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";

import { ApolloServer } from "@apollo/server";
import { type EntityManager, type MikroORM, wrap } from "@mikro-orm/core";
import assert from "node:assert";
import { MockAgent, setGlobalDispatcher } from "undici";
import { expect, test as testBase } from "vitest";

import { database } from "../database/database.ts";
import { MediaEntryFactory } from "../database/factories/media-entry.factory.ts";
import { StreamFactory } from "../database/factories/stream.factory.ts";
import { CompletedMovieSeeder } from "../database/seeders/movies/completed-movie.seeder.ts";
import { MovieSeeder } from "../database/seeders/movies/movie.seeder.ts";
import { ScrapedMovieSeeder } from "../database/seeders/movies/scraped-movie.seeder.ts";
import { CompletedShowSeeder } from "../database/seeders/shows/completed-show.seeder.ts";
import { ScrapedShowSeeder } from "../database/seeders/shows/scraped-show.seeder.ts";
import { ShowSeeder } from "../database/seeders/shows/show.seeder.ts";

import type { SetupServerApi } from "msw/node";

type SeederResult<T, C extends number> = C extends 1 ? T : [T, ...T[]];

type SeederFunction<T> = <C extends number = 1>(
  count?: C,
) => Promise<SeederResult<T, C>>;

export const rivenTestContext = testBase.extend<{
  server: SetupServerApi;
  apolloServerInstance: ApolloServer;
  gqlServer: ApolloServer;
  mockAgent: MockAgent;
  em: EntityManager;
  seeders: {
    seedMovie: SeederFunction<Movie>;
    seedScrapedMovie: SeederFunction<Movie>;
    seedCompletedMovie: SeederFunction<Movie>;
    seedShow: SeederFunction<Show>;
    seedScrapedShow: SeederFunction<Show>;
    seedCompletedShow: SeederFunction<Show>;
  };
  orm: MikroORM;
  movie: Movie;
  scrapedMovie: Movie;
  completedMovie: Movie;
  show: Show;
  scrapedShow: Show;
  completedShow: Show;
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
  orm: database.orm,
  movie: async ({ seeders }, use) => {
    const movie = await seeders.seedMovie();

    await use(movie);
  },
  scrapedMovie: async ({ seeders }, use) => {
    const scrapedMovie = await seeders.seedScrapedMovie();

    await use(scrapedMovie);
  },
  completedMovie: async ({ seeders }, use) => {
    const completedMovie = await seeders.seedCompletedMovie();

    await use(completedMovie);
  },
  show: async ({ seeders }, use) => {
    const show = await seeders.seedShow();

    await use(show);
  },
  scrapedShow: async ({ seeders }, use) => {
    const scrapedShow = await seeders.seedScrapedShow();

    await use(scrapedShow);
  },
  completedShow: async ({ seeders }, use) => {
    const completedShow = await seeders.seedCompletedShow();

    await use(completedShow);
  },
  season: async ({ show }, use) => {
    await wrap(show).populate(["seasons"]);

    expect.assert(show.seasons[0]);

    await use(show.seasons[0]);
  },
  episode: async ({ season }, use) => {
    await wrap(season).populate(["episodes"]);

    expect.assert(season.episodes[0]);

    await use(season.episodes[0]);
  },
  stream: async ({ em }, use) => {
    const stream = await new StreamFactory(em).createOne();

    await use(stream);
  },
  mediaEntry: async ({ em }, use) => {
    const mediaEntry = new MediaEntryFactory(em).makeOne({
      downloadUrl: "http://example.com/file.mp4",
      originalFilename: "file.mp4",
      plugin: "@repo/plugin-test",
    });

    await use(mediaEntry);
  },
  seeders: async ({ em, orm }, use) => {
    await use({
      async seedMovie<C extends number = 1>(
        count?: C,
      ): Promise<SeederResult<Movie, C>> {
        const actualCount = count ?? (1 as C);

        await orm.seeder.seed(
          ...Array(actualCount)
            .fill(null)
            .map(() => MovieSeeder),
        );

        const movies = await em.findAll(Movie);

        assert(movies[0]);

        if (actualCount === 1) {
          return movies[0] as SeederResult<Movie, C>;
        }

        return [movies[0], ...movies.slice(1)] as SeederResult<Movie, C>;
      },
      async seedScrapedMovie<C extends number = 1>(
        count?: C,
      ): Promise<SeederResult<Movie, C>> {
        const actualCount = count ?? (1 as C);

        await orm.seeder.seed(
          ...Array(actualCount)
            .fill(null)
            .map(() => ScrapedMovieSeeder),
        );

        const movie = await em.find(Movie, {
          state: "scraped",
        });

        assert(movie[0]);

        if (actualCount === 1) {
          return movie[0] as SeederResult<Movie, C>;
        }

        return [movie[0], ...movie.slice(1)] as SeederResult<Movie, C>;
      },
      async seedCompletedMovie<C extends number = 1>(
        count?: C,
      ): Promise<SeederResult<Movie, C>> {
        const actualCount = count ?? (1 as C);

        await orm.seeder.seed(
          ...Array(actualCount)
            .fill(null)
            .map(() => CompletedMovieSeeder),
        );

        const movies = await em.find(Movie, {
          state: "completed",
        });

        assert(movies[0]);

        if (actualCount === 1) {
          return movies[0] as SeederResult<Movie, C>;
        }

        return [movies[0], ...movies.slice(1)] as SeederResult<Movie, C>;
      },
      async seedShow<C extends number = 1>(
        count?: C,
      ): Promise<SeederResult<Show, C>> {
        const actualCount = count ?? (1 as C);

        await orm.seeder.seed(
          ...Array(actualCount)
            .fill(null)
            .map(() => ShowSeeder),
        );

        const shows = await em.findAll(Show);

        assert(shows[0]);

        if (actualCount === 1) {
          return shows[0] as SeederResult<Show, C>;
        }

        return [shows[0], ...shows.slice(1)] as SeederResult<Show, C>;
      },
      async seedScrapedShow<C extends number = 1>(
        count?: C,
      ): Promise<SeederResult<Show, C>> {
        const actualCount = count ?? (1 as C);

        await orm.seeder.seed(
          ...Array(actualCount)
            .fill(null)
            .map(() => ScrapedShowSeeder),
        );

        const shows = await em.find(Show, {
          state: "scraped",
        });

        assert(shows[0]);

        if (actualCount === 1) {
          return shows[0] as SeederResult<Show, C>;
        }

        return [shows[0], ...shows.slice(1)] as SeederResult<Show, C>;
      },
      async seedCompletedShow<C extends number = 1>(
        count?: C,
      ): Promise<SeederResult<Show, C>> {
        const actualCount = count ?? (1 as C);

        await orm.seeder.seed(
          ...Array(actualCount)
            .fill(null)
            .map(() => CompletedShowSeeder),
        );

        const shows = await em.findAll(Show);

        assert(shows[0]);

        if (actualCount === 1) {
          return shows[0] as SeederResult<Show, C>;
        }

        return [shows[0], ...shows.slice(1)] as SeederResult<Show, C>;
      },
    });
  },
});
