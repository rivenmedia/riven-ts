import { logger } from "@repo/core-util-logger";

import {
  type DataSourceConfig,
  type DataSourceFetchResult,
  type DataSourceRequest,
  RESTDataSource,
  type RequestOptions,
} from "@apollo/datasource-rest";
import { Queue, type RateLimiterOptions, Worker } from "bullmq";
import { DateTime } from "luxon";

import { registerMQListeners } from "../helpers/register-mq-listeners.ts";

import type { Promisable } from "type-fest";

interface FetchJobInput {
  path: string;
  incomingRequest: DataSourceRequest | undefined;
}

export interface BaseDataSourceConfig extends DataSourceConfig {
  token?: string | undefined;
  redisUrl: string;
}

export abstract class BaseDataSource extends RESTDataSource {
  readonly serviceName: string;
  readonly token: string | undefined;

  protected readonly rateLimiterOptions?: RateLimiterOptions | undefined;

  #queue: Queue<FetchJobInput, DataSourceFetchResult<unknown>>;
  #worker: Worker<FetchJobInput, DataSourceFetchResult<unknown>>;
  #queueId: string;

  constructor({
    redisUrl,
    token,
    ...apolloDataSourceOptions
  }: BaseDataSourceConfig) {
    super(apolloDataSourceOptions);

    this.#queueId = this.constructor.name;
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

    registerMQListeners(this.#queue);

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

    registerMQListeners(this.#worker);

    this.token = token;
    this.logger = logger;
    this.serviceName = this.constructor.name;
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
    const job = await this.#queue.add("fetch", { path, incomingRequest });
    const result = await new Promise<DataSourceFetchResult<TResult>>(
      (resolve, reject) => {
        const timeoutDuration = 30000; // 30 seconds timeout
        const timeout = setTimeout(() => {
          reject(new Error("Request timed out"));
        }, timeoutDuration);

        this.#worker
          .on("completed", (completedJob, result) => {
            if (completedJob.id === job.id) {
              clearTimeout(timeout);
              resolve(result as DataSourceFetchResult<TResult>);
            }
          })
          .on("failed", (_job, error) => {
            reject(error);
          });
      },
    );

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

    return result;
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
