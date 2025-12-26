import type { GetStatusQuery } from "./index.generated.ts";
import {
  InMemoryCache,
  HttpLink,
  ApolloClient,
  ApolloLink,
  gql,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { logger } from "@repo/core-util-logger";
import { createActor, fromPromise, setup } from "xstate";

const startupMachine = setup({
  types: {
    context: {} as {
      client: ApolloClient;
      version: string | null;
    },
    events: {} as { type: "START" } | { type: "EXIT" },
  },
  actors: {
    startup: fromPromise(
      async ({ input: { client } }: { input: { client: ApolloClient } }) => {
        const result = await client.query<GetStatusQuery>({
          query: gql`
            query GetStatus {
              settings {
                riven {
                  version
                }
              }
            }
          `,
        });

        if (!result.data?.settings.riven.version) {
          throw new Error("Failed to fetch Riven version");
        }

        return result.data.settings.riven.version;
      },
    ),
    run: fromPromise(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }),
  },
}).createMachine({
  id: "startup-machine",
  initial: "Idle",
  context: () => {
    const client = new ApolloClient({
      link: ApolloLink.from([
        new RetryLink({
          attempts: {
            max: 3,
          },
          delay: {
            initial: 1000,
            max: 10000,
          },
        }),
        new HttpLink({
          uri: "http://localhost:3000/graphql",
        }),
      ]),
      cache: new InMemoryCache(),
      dataMasking: true,
      devtools: {
        enabled: true,
      },
    });

    return {
      client,
      version: null,
    };
  },
  on: {
    EXIT: ".Exited",
  },
  states: {
    Idle: {
      on: {
        START: "Initialising",
      },
    },
    Initialising: {
      invoke: {
        id: "startup",
        src: "startup",
        input: ({ context }) => ({
          client: context.client,
        }),
        onError: {
          actions: [
            ({ event }) => {
              logger.error("Startup failed:", event.error);
            },
          ],
        },
        onDone: {
          actions: [
            ({ event }) => {
              logger.info(`Riven is running version: ${event.output}`);
            },
          ],
          target: "Running",
        },
      },
      entry() {
        logger.info("Riven is starting up...");
      },
    },
    Running: {
      invoke: {
        id: "run",
        src: "run",
        onDone: [
          {
            target: "Running",
            reenter: true,
          },
        ],
      },
    },
    Exited: {
      type: "final",
      entry() {
        logger.info("Riven is shutting down...");
      },
    },
  },
});

const actor = createActor(startupMachine);

actor.subscribe(
  (snapshot) => {
    logger.info(`State: ${snapshot.value}`);
  },
  () => {
    logger.error("Actor encountered an error");
  },
);

actor.start();
actor.send({ type: "START" });

process.on("SIGINT", () => {
  actor.send({ type: "EXIT" });
});
