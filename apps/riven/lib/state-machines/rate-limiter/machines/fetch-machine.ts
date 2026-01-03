import type {
  FetcherRequestInit,
  FetcherResponse,
} from "@apollo/utils.fetcher";
import type { RateLimiter } from "limiter";
import type { UUID } from "node:crypto";
import { type ActorRef, type Snapshot, assign, sendTo, setup } from "xstate";
import { z } from "zod";

import { withLogAction } from "../../utilities/with-log-action.ts";
import { fetchActorLogic } from "../actors/fetch.actor.ts";
import { RateLimitError } from "../errors/rate-limit-error.ts";
import type { RateLimiterMachineEvent } from "../index.ts";

export interface RateLimitedFetchMachineInput {
  limiter: RateLimiter | null;
  maxRetries?: number;
  fetchOpts: FetcherRequestInit | undefined;
  url: string;
  parentRef: ActorRef<Snapshot<unknown>, RateLimiterMachineEvent>;
  requestId: UUID;
}

export interface RateLimitedFetchMachineContext {
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

  /**
   * The rate limiter to use for the fetch operation.
   */
  limiter: RateLimiter | null;

  parentRef: ActorRef<Snapshot<unknown>, RateLimiterMachineEvent>;

  requestId: UUID;
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
      response,
      error: null,
      retryDelayMs: null,
    })),
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

      return context.retryDelayMs;
    },
  },
})
  .extend(withLogAction)
  .createMachine({
    id: "Rate limited fetch",
    initial: "Idle",
    context: ({ input }) => ({
      url: input.url,
      fetchOpts: input.fetchOpts,
      requestAttempts: 0,
      maxRetries: input.maxRetries ?? 3,
      limiter: input.limiter,
      parentRef: input.parentRef,
      requestId: input.requestId,
      retryDelayMs: null,
      data: null,
      error: null,
      response: null,
    }),
    exit: sendTo(
      ({ context }) => context.parentRef,
      ({ context }) => ({
        type: "fetch-completed",
        requestId: context.requestId,
      }),
    ),
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
            params: ({ context }) => ({
              message: `Starting fetch for URL: ${context.url}`,
            }),
          },
        ],
        invoke: {
          id: "fetch",
          src: "fetch",
          input: ({ context }) => ({
            url: context.url,
            fetchOpts: context.fetchOpts,
            limiter: context.limiter,
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
              target: "Failed",
            },
          ],
        },
      },
      "Rate limited": {
        always: {
          guard: "isMaxRetriesReached",
          target: "Failed",
        },
        entry: {
          type: "log",
          params: ({ context }) => ({
            message: `Request was rate limited. Retrying in ${context.retryDelayMs?.toString() ?? "Unknown"} ms.`,
          }),
        },
        after: {
          retryFetch: {
            target: "Fetching",
            actions: {
              type: "log",
              params: ({ context: { requestAttempts, maxRetries, url } }) => ({
                message: `Retrying fetch for URL: ${url} (Attempt ${(requestAttempts + 1).toString()} of ${(maxRetries + 1).toString()})`,
              }),
            },
          },
        },
      },
      Failed: {
        type: "final",
        entry: ({ context }) => {
          if (context.error) {
            throw context.error;
          }

          throw new Error(
            "Reached Failed state without an error. This is likely a bug. Please report it.",
          );
        },
      },
      Success: {
        type: "final",
      },
    },
  });
