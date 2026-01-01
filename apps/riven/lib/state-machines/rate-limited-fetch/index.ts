import { assign, log, setup } from "xstate";
import { z } from "zod";
import { fetchActorLogic } from "./actors/fetch.actor.ts";
import { RateLimitError } from "./errors/rate-limit-error.ts";
import type {
  FetcherRequestInit,
  FetcherResponse,
} from "@apollo/utils.fetcher";
import { logger } from "@repo/core-util-logger";

export interface RateLimitedFetchMachineInput {
  maxRetries?: number;
  fetchOpts: FetcherRequestInit | undefined;
  url: string;
}

export interface RateLimitedFetchMachineContext {
  /**
   * The fetched data validated against the provided schema.
   * If the fetch fails, this will be `null`.
   */
  // data: z.infer<T> | null;

  // /**
  //  * The Zod schema used to validate the fetched data.
  //  */
  // schema: T;

  /**
   * The error encountered during the fetch operation, if any.
   */
  error: Error | null;

  /**
   * The delay in milliseconds before retrying the request after a rate limit error.
   */
  retryDelayMs: number | null;

  /**
   * The URL to fetch data from.
   */
  url: string;

  /**
   * The number of fetch attempts made.
   */
  requestAttempts: number;

  /**
   * The maximum number of retry attempts allowed.
   */
  maxRetries: number;

  /**
   * The raw response from the fetch operation, if any.
   */
  response: FetcherResponse | null;

  /**
   * The options to use for the fetch operation.
   */
  fetchOpts: FetcherRequestInit | undefined;
}

export interface RateLimitedFetchMachineEvent {
  type: "fetch";
}

export const rateLimitedFetchMachine = setup({
  types: {
    context: {} as RateLimitedFetchMachineContext,
    input: {} as RateLimitedFetchMachineInput,
    events: {} as RateLimitedFetchMachineEvent,
    children: {} as {
      fetch: "fetch";
    },
    output: {} as FetcherResponse,
  },
  actions: {
    incrementRequestAttempts: assign(({ context }) => ({
      requestAttempts: context.requestAttempts + 1,
    })),
    handleRateLimitResponse: assign(
      (_, { error }: { error: RateLimitError }) => ({
        error,
        retryDelayMs: error.retryAfter,
      }),
    ),
    handleResponseError: assign((_, { error }: { error: Error | null }) => ({
      error,
      retryDelayMs: null,
    })),
    handleSuccess: assign((_, { response }: { response: FetcherResponse }) => ({
      // data: context.schema.parse(data),
      response,
      error: null,
      retryDelayMs: null,
    })),
    setResponse: assign((_, { response }: { response: FetcherResponse }) => ({
      response,
    })),
    log: (_, message: string) => logger.http(message),
  },
  actors: {
    fetch: fetchActorLogic,
  },
  guards: {
    isRateLimitError: (_, error: Error) => error instanceof RateLimitError,
    isMaxRetriesReached: ({ context }) =>
      context.requestAttempts - 1 >= context.maxRetries,
  },
  delays: {
    retryFetch: ({ context }) => {
      if (context.retryDelayMs === null) {
        return 0;
      }

      return context.retryDelayMs - Date.now();
    },
  },
}).createMachine({
  id: "Rate limited fetch",
  initial: "Idle",
  context: ({ input }) => ({
    url: input.url,
    fetchOpts: input.fetchOpts,
    requestAttempts: 0,
    maxRetries: input.maxRetries ?? 3,
    retryDelayMs: null,
    data: null,
    error: null,
    response: null,
  }),
  output: ({ context }) => {
    if (!context.response) {
      throw new Error(
        "Cannot get output from RateLimitedFetchMachine: no response available.",
      );
    }

    return context.response;
  },
  states: {
    Idle: {
      on: {
        fetch: "Fetching",
      },
    },
    Fetching: {
      on: {
        fetch: undefined, // ignore additional fetch events whilst fetching
      },
      entry: [
        "incrementRequestAttempts",
        {
          type: "log",
          params: ({ context }) => `Starting fetch for URL: ${context.url}`,
        },
      ],
      invoke: {
        id: "fetch",
        src: "fetch",
        input: ({ context }) => ({
          url: context.url,
          fetchOpts: context.fetchOpts,
        }),
        onDone: {
          target: "Success",
          actions: {
            type: "handleSuccess",
            params: ({ event }) => ({ response: event.output }),
          },
        },
        onError: [
          {
            actions: {
              type: "handleRateLimitResponse",
              params: ({ event }) => ({
                error: z.instanceof(RateLimitError).parse(event.error),
              }),
            },
            guard: {
              type: "isRateLimitError",
              params: ({ event }) => z.instanceof(Error).parse(event.error),
            },
            target: "Rate limited",
          },
          {
            actions: {
              type: "handleResponseError",
              params: ({ event }) => ({
                error: z.instanceof(Error).parse(event.error),
              }),
            },
            target: "Failure",
          },
        ],
      },
    },
    "Rate limited": {
      always: {
        guard: "isMaxRetriesReached",
        target: "Failure",
      },
      entry: {
        type: "log",
        params: ({ context }) =>
          `Request was rate limited. Retrying in ${context.retryDelayMs?.toString() ?? "?"} ms.`,
      },
      after: {
        retryFetch: {
          target: "Fetching",
          actions: log("Retrying fetch after rate limit"),
        },
      },
    },
    Failure: {
      type: "final",
      entry: ({ context }) => {
        if (context.error) {
          throw context.error;
        }

        throw new Error(
          "Reached Failure state without an error. This is likely a bug. Please report it.",
        );
      },
    },
    Success: {
      type: "final",
    },
  },
});
