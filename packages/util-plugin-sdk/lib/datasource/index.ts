import { logger } from "@repo/core-util-logger";

import {
  type AugmentedRequest,
  type DataSourceConfig,
  type DataSourceFetchResult,
  type DataSourceRequest,
  RESTDataSource,
  type RequestOptions,
} from "@apollo/datasource-rest";
import { Queue, QueueEvents, type RateLimiterOptions, Worker } from "bullmq";
import { DateTime } from "luxon";

import { registerMQListeners } from "../helpers/register-mq-listeners.ts";

import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import type { Promisable } from "type-fest";

interface FetchJobInput {
  path: string;
  incomingRequest: DataSourceRequest | undefined;
}

type FetchResponse<T = unknown> = Pick<
  DataSourceFetchResult<T>,
  "parsedBody"
> & {
  response: {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
};

export interface BaseDataSourceConfig extends DataSourceConfig {
  pluginSymbol: symbol;
  token?: string | undefined;
  redisUrl: string;
}

export abstract class BaseDataSource extends RESTDataSource {
  readonly serviceName: string;
  readonly token: string | undefined;

  protected readonly rateLimiterOptions?: RateLimiterOptions | undefined;

  #queue: Queue<FetchJobInput, FetchResponse>;
  #queueEvents: QueueEvents;
  #worker: Worker<FetchJobInput, FetchResponse>;
  #queueId: string;

  #keyv: KeyvAdapter;
  #keyvPrefix = "httpcache:";

  constructor({
    pluginSymbol,
    redisUrl,
    token,
    ...apolloDataSourceOptions
  }: BaseDataSourceConfig) {
    super(apolloDataSourceOptions);

    this.#keyv = apolloDataSourceOptions.cache as KeyvAdapter;

    this.serviceName = this.constructor.name;
    this.#queueId = `${pluginSymbol.description ?? "unknown"}-${this.serviceName}-fetch-queue`;
    this.#queue = new Queue(this.#queueId, {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        backoff: {
          type: "exponential",
          delay: 1000,
          jitter: 0.5,
        },
      },
    });

    // Clear any previously queued fetch requests on startup.
    // It's highly likely they'll be stale, and will be recreated as needed.
    void this.#queue.obliterate({ force: true });

    this.#queueEvents = new QueueEvents(this.#queueId, {
      connection: {
        url: redisUrl,
      },
    });

    this.#worker = new Worker(
      this.#queueId,
      async (job) => {
        const { response, parsedBody } = await super.fetch(
          job.data.path,
          job.data.incomingRequest,
        );

        return {
          parsedBody,
          response: {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers),
          },
        };
      },
      {
        connection: {
          url: redisUrl,
        },
        ...(this.rateLimiterOptions
          ? { limiter: this.rateLimiterOptions }
          : {}),
      },
    );

    registerMQListeners(this.#queue);
    registerMQListeners(this.#worker);

    this.token = token;
    this.logger = logger;
  }

  #parseRetryAfterHeader(retryAfterHeader: string | number): number | null {
    if (typeof retryAfterHeader === "number") {
      return retryAfterHeader;
    }

    const httpDate = DateTime.fromHTTP(retryAfterHeader);

    if (httpDate.isValid) {
      return httpDate.diffNow().milliseconds;
    }

    const retryAfterSeconds = parseInt(retryAfterHeader, 10);

    if (isNaN(retryAfterSeconds)) {
      return null;
    }

    // If the Retry-After header is a number, it's the number of **seconds** to wait
    return retryAfterSeconds * 1000;
  }

  #urlSearchParamsFromRecord(
    params: Record<string, string | undefined> | undefined,
  ): URLSearchParams {
    const usp = new URLSearchParams();

    if (params) {
      for (const [name, value] of Object.entries(params)) {
        if (value !== undefined) {
          usp.set(name, value);
        }
      }
    }

    return usp;
  }

  // Generate a cache key for the request, after applying any request modifications
  // This is mostly copied from RESTDataSource, as there was no native way to determine
  // whether a request is cached without actually performing subsequent fetch.
  async #getCacheKey(
    path: string,
    incomingRequest?: DataSourceRequest,
  ): Promise<string> {
    const downcasedHeaders: Record<string, string> = {};
    const augmentedRequest: AugmentedRequest = {
      ...incomingRequest,
      params:
        incomingRequest?.params instanceof URLSearchParams
          ? incomingRequest.params
          : this.#urlSearchParamsFromRecord(incomingRequest?.params),
      headers: downcasedHeaders,
    };

    await this.willSendRequest?.(path, augmentedRequest);

    const url = await this.resolveURL(path, augmentedRequest);

    // Append params to existing params in the path
    for (const [name, value] of augmentedRequest.params) {
      url.searchParams.append(name, value);
    }

    if (this.shouldJSONSerializeBody(augmentedRequest.body)) {
      augmentedRequest.body = JSON.stringify(augmentedRequest.body);

      // If Content-Type header has not been previously set, set to application/json
      augmentedRequest.headers["content-type"] ??= "application/json";
    }

    return this.cacheKeyFor(url, augmentedRequest as never);
  }

  override async fetch<TResult>(
    path: string,
    incomingRequest?: DataSourceRequest,
  ): Promise<DataSourceFetchResult<TResult>> {
    const cacheKey = await this.#getCacheKey(path, incomingRequest);
    const isCached = Boolean(
      await this.#keyv.get(`${this.#keyvPrefix}${cacheKey}`),
    );

    if (isCached) {
      // If we have a cached response, bypass the message queue and fetch directly
      return await super.fetch(path, incomingRequest);
    }

    // Redis keys use colons as a separator, so they need to be stripped out before insertion
    const sanitisedJobId = cacheKey.replaceAll(":", "[COLON]");

    const job = await this.#queue.add(
      cacheKey,
      { path, incomingRequest },
      { jobId: sanitisedJobId },
    );

    const result = await job.waitUntilFinished(this.#queueEvents, 10000);

    if (result.response.status === 429) {
      const waitMs = this.#parseRetryAfterHeader(
        result.response.headers["retry-after"] ?? "",
      );

      if (!waitMs) {
        logger.warn(
          `[${this.serviceName}] Received 429 response without valid Retry-After header for ${path}. Using default wait time of 1000ms.`,
        );
      }

      await this.#queue.rateLimit(waitMs ?? 1000);

      throw Worker.RateLimitError();
    }

    this.logger.debug(
      `[${this.serviceName}] HTTP ${result.response.status.toString()} response for ${path}: ${JSON.stringify(result, null, 2)}`,
    );

    return {
      parsedBody: result.parsedBody as TResult,
      response: result.response as never,

      // The following fields aren't used by the application,
      // but must be included to satisfy the return type.
      responseFromCache: false,
      requestDeduplication: undefined as never,
      httpCache: {
        cacheWritePromise: Promise.resolve(),
      },
    };
  }

  protected override didEncounterError(
    error: Error,
    _request: RequestOptions,
    url: URL,
  ): void {
    this.logger.error(
      `[${this.serviceName}] API Error for ${url}: ${error.message}`,
    );
  }

  abstract validate(): Promisable<boolean>;

  static getApiToken(): string | undefined {
    return undefined;
  }
}

export type { RateLimiterOptions } from "bullmq";
