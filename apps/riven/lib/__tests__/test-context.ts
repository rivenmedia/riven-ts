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
import { MockAgent, setGlobalDispatcher } from "undici";
import { expect, test as testBase } from "vitest";

import { database } from "../database/database.ts";
import { MediaEntryFactory } from "../database/factories/media-entry.factory.ts";
import { StreamFactory } from "../database/factories/stream.factory.ts";
import { MovieSeeder } from "../database/seeders/movies/movie.seeder.ts";
import { ShowSeeder } from "../database/seeders/shows/show.seeder.ts";

import type { SetupServerApi } from "msw/node";

export const rivenTestContext = testBase.extend<{
  server: SetupServerApi;
  apolloServerInstance: ApolloServer;
  gqlServer: ApolloServer;
  mockAgent: MockAgent;
  em: EntityManager;
  orm: MikroORM;
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
  orm: database.orm,
  movie: async ({ em, orm }, use) => {
    await orm.seeder.seed(MovieSeeder);

    const movie = await em.findOneOrFail(Movie, {
      type: "movie",
    });

    await use(movie);
  },
  show: async ({ orm, em }, use) => {
    await orm.seeder.seed(ShowSeeder);

    const shows = await em.findAll(Show);

    expect.assert(shows[0]);

    await use(shows[0]);
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
});
