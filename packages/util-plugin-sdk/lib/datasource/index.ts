import { logger } from "@repo/core-util-logger";

import {
  type DataSourceConfig,
  type DataSourceFetchResult,
  type DataSourceRequest,
  RESTDataSource,
  type RequestOptions,
} from "@apollo/datasource-rest";
import { Queue, QueueEvents, type RateLimiterOptions, Worker } from "bullmq";
import { DateTime } from "luxon";

import { registerMQListeners } from "../helpers/register-mq-listeners.ts";

import type { Promisable } from "type-fest";

interface FetchJobInput {
  path: string;
  incomingRequest: DataSourceRequest | undefined;
}

export interface BaseDataSourceConfig extends DataSourceConfig {
  pluginSymbol: symbol;
  token?: string | undefined;
  redisUrl: string;
}

export abstract class BaseDataSource extends RESTDataSource {
  readonly serviceName: string;
  readonly token: string | undefined;

  protected readonly rateLimiterOptions?: RateLimiterOptions | undefined;

  #queue: Queue<FetchJobInput, DataSourceFetchResult<unknown>>;
  #queueEvents: QueueEvents;
  #worker: Worker<FetchJobInput, DataSourceFetchResult<unknown>>;
  #queueId: string;

  constructor({
    pluginSymbol,
    redisUrl,
    token,
    ...apolloDataSourceOptions
  }: BaseDataSourceConfig) {
    super(apolloDataSourceOptions);

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
      (job) => super.fetch(job.data.path, job.data.incomingRequest),
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

  override async fetch<TResult>(
    path: string,
    incomingRequest?: DataSourceRequest,
  ): Promise<DataSourceFetchResult<TResult>> {
    const jobId = this.cacheKeyFor(
      new URL(path, this.baseURL),
      (incomingRequest ?? {}) as never,
    );

    // Redis keys use colons as a separator, so they need to be stripped out before insertion
    const sanitisedJobId = jobId.replaceAll(":", "[COLON]");

    const job = await this.#queue.add(
      sanitisedJobId,
      { path, incomingRequest },
      { jobId: sanitisedJobId },
    );

    const result = await job.waitUntilFinished(this.#queueEvents, 10000);

    if (result.response.status === 429) {
      const waitMs = this.#parseRetryAfterHeader(
        result.response.headers.get("Retry-After") ?? "",
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

    return result as DataSourceFetchResult<TResult>;
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
