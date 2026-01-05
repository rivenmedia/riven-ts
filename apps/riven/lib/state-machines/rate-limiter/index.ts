import { RateLimiter, type RateLimiterOpts } from "limiter";
import { type ActorRefFromLogic, assign, setup, stopChild } from "xstate";

import { withLogAction } from "../utilities/with-log-action.ts";
import { rateLimitedFetchMachine } from "./machines/fetch-machine.ts";

import type { FetcherRequestInit } from "@apollo/utils.fetcher";
import type { UUID } from "node:crypto";

export interface RateLimiterMachineInput {
  limiterOptions: RateLimiterOpts | null;
}

export interface RateLimiterMachineContext {
  limiter: RateLimiter | null;
  requestQueue: Map<UUID, ActorRefFromLogic<typeof rateLimitedFetchMachine>>;
}

export type RateLimiterMachineEvent =
  | {
      type: "fetch-requested";
      url: string;
      fetchOpts: FetcherRequestInit | undefined;
      requestId: UUID;
    }
  | {
      type: "fetch-completed";
      requestId: UUID;
    };

export const rateLimiterMachine = setup({
  types: {
    context: {} as RateLimiterMachineContext,
    input: {} as RateLimiterMachineInput,
    events: {} as RateLimiterMachineEvent,
  },
  actions: {
    addToQueue: assign(
      (
        { context, spawn, self },
        {
          fetchOpts,
          url,
          requestId,
        }: {
          url: string;
          fetchOpts: FetcherRequestInit | undefined;
          requestId: UUID;
        },
      ) => {
        const fetchRef = spawn("fetch", {
          id: `fetch-${requestId}`,
          input: {
            url,
            fetchOpts,
            limiter: context.limiter,
            parentRef: self,
            requestId,
          },
        });

        return {
          requestQueue: context.requestQueue.set(requestId, fetchRef),
        };
      },
    ),
    removeFromQueue: ({ context }, { requestId }: { requestId: UUID }) => {
      context.requestQueue.delete(requestId);

      return [
        stopChild(`fetch-${requestId}`),
        assign({
          requestQueue: new Map(context.requestQueue),
        }),
      ];
    },
  },
  actors: {
    fetch: rateLimitedFetchMachine,
  },
})
  .extend(withLogAction)
  .createMachine({
    id: "Rate limiter",
    initial: "Listening",
    context: ({ input }) => ({
      limiter:
        input.limiterOptions !== null
          ? new RateLimiter(input.limiterOptions)
          : null,
      requestQueue: new Map(),
    }),
    entry: {
      type: "log",
      params: {
        message: "Starting rate limiter machine",
      },
    },
    exit: {
      type: "log",
      params: {
        message: "Shutting down rate limiter machine",
      },
    },
    on: {
      "fetch-requested": {
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Fetch requested for URL ${event.url} with request ID ${event.requestId}`,
            }),
          },
          {
            type: "addToQueue",
            params: ({ event }) => ({
              url: event.url,
              fetchOpts: event.fetchOpts,
              requestId: event.requestId,
            }),
          },
        ],
      },
      "fetch-completed": {
        actions: [
          {
            type: "log",
            params: ({ event }) => ({
              message: `Fetch completed for request ID ${event.requestId}`,
            }),
          },
          {
            type: "removeFromQueue",
            params: ({ event }) => ({
              requestId: event.requestId,
            }),
          },
        ],
      },
    },
    states: {
      Listening: {},
    },
  });
