import { RateLimiter } from "limiter";
import { fromPromise } from "xstate";

import { RateLimitError } from "../errors/rate-limit-error.ts";

import type {
  FetcherRequestInit,
  FetcherResponse,
} from "@apollo/utils.fetcher";

export interface FetchInput {
  limiter: RateLimiter | null;
  fetchOpts: FetcherRequestInit | undefined;
  url: string;
}

export const fetchActorLogic = fromPromise<FetcherResponse, FetchInput>(
  async ({ input: { url, fetchOpts, limiter }, signal }) => {
    if (limiter) {
      const tokensRequired = 1;
      const canRequest = limiter.tryRemoveTokens(tokensRequired);

      if (!canRequest) {
        throw new RateLimitError(limiter, url, null);
      }
    }

    const response = await fetch(url, {
      ...(fetchOpts as RequestInit),
      signal,
    });

    if (response.status === 429) {
      throw new RateLimitError(
        limiter,
        url,
        response.headers.get("Retry-After"),
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response;
  },
);
