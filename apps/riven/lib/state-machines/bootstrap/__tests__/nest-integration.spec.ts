/* eslint-disable @typescript-eslint/require-await */
import Fuse from "@zkochan/fuse-native";
import { expect } from "vitest";
import { createActor, createEmptyActor, fromPromise, toPromise } from "xstate";

import { it as baseIt } from "../../../__tests__/test-context.ts";
import { bootstrapMachine } from "../index.ts";

import type {
  InitialiseVfsInput,
  InitialiseVfsOutput,
} from "../actors/initialise-vfs.actor.ts";

/**
 * Exercises the real GraphQL bootstrap actor, which the other bootstrap tests
 * stub out. It is the only place that covers the whole chain end to end:
 * creating the Nest container, resolving resolvers through the type-graphql
 * container, merging in plugin resolvers, and serving a query over HTTP that
 * reaches an injected service and the database.
 *
 * Only the database connection and the VFS mount are substituted - the former
 * because the suite already provides an in-memory database, the latter because
 * it needs a real FUSE mount.
 */
const it = baseIt
  .extend(
    "actor",
    async ({ applicationContext, completedMovieContext }, { onCleanup }) => {
      // Referenced so the fixture seeds the database before the server starts.
      expect(completedMovieContext.completedMovie).toBeDefined();

      const machine = bootstrapMachine.provide({
        actors: {
          initialiseDatabaseConnection: fromPromise(async () => {
            /* The suite already provides an initialised in-memory database. */
          }),
          initialiseVfs: fromPromise<InitialiseVfsOutput, InitialiseVfsInput>(
            async () => ({
              vfs: new Fuse("/mnt/fake-path", {}),
            }),
          ),
        },
      });

      const actor = createActor(machine, {
        input: {
          applicationContext,
          rootRef: createEmptyActor(),
          mainRunnerRef: createEmptyActor(),
          mockScenario: undefined,
        },
      });

      onCleanup(async () => {
        actor.stop();
      });

      return actor;
    },
  )
  .extend("bootstrapOutput", async ({ actor }, { onCleanup }) => {
    const output = await toPromise(actor.start());

    onCleanup(async () => {
      await output.server.stop();
    });

    return output;
  });

it("serves a query backed by an injected service", async ({
  bootstrapOutput,
  completedMovieContext: { completedMovie },
}) => {
  // The server is reached over the network below, so the fixture is asserted
  // here to tie the running instance to this test.
  expect(bootstrapOutput.server).toBeDefined();

  // Resolved by MediaItemResolver, which receives MediaItemService by
  // constructor injection rather than through the GraphQL context.
  const response = await fetch("http://localhost:34567/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: `query MediaItemById($id: ID!) {
        mediaItemById(id: $id) {
          ... on Movie {
            id
            fullTitle
          }
        }
      }`,
      variables: { id: completedMovie.id },
    }),
  });

  const { data, errors } = (await response.json()) as {
    data?: { mediaItemById?: { id: string; fullTitle: string } };
    errors?: unknown[];
  };

  expect(errors).toBeUndefined();
  expect(data?.mediaItemById).toMatchObject({
    id: completedMovie.id,
    fullTitle: completedMovie.fullTitle,
  });
});
