import { fromPromise } from "xstate";
import { RateLimitError } from "../errors/rate-limit-error.ts";
import type {
  FetcherResponse,
  FetcherRequestInit,
} from "@apollo/utils.fetcher";

export interface FetchInput {
  fetchOpts: FetcherRequestInit | undefined;
  url: string;
}

export const fetchActorLogic = fromPromise<FetcherResponse, FetchInput>(
  async ({ input: { url, fetchOpts }, signal }) => {
    console.log(url, fetchOpts);
    const response = await fetch(url, {
      ...fetchOpts,
      signal,
    });

    if (response.status === 429) {
      throw new RateLimitError(url, response.headers.get("Retry-After"));
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    return response;
  },
);
