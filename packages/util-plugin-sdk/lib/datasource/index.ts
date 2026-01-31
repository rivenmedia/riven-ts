import {
  type AugmentedRequest,
  type DataSourceConfig,
  type DataSourceFetchResult,
  type DataSourceRequest,
  RESTDataSource,
  type RequestOptions,
} from "@apollo/datasource-rest";
import {
  type Job,
  Queue,
  QueueEvents,
  type RateLimiterOptions,
  Worker,
} from "bullmq";
import { DateTime } from "luxon";
import { Logger } from "winston";
import z from "zod";

import { registerMQListeners } from "../helpers/register-mq-listeners.ts";
import { jsonCodec } from "../validation/json-parser.ts";
import { urlSearchParamsCodec } from "../validation/url-search-params-parser.ts";

import type { KeyvAdapter } from "@apollo/utils.keyvadapter";
import type { Promisable } from "type-fest";

interface FetchJobInput {
  path: string;
  incomingRequest: DataSourceRequest | undefined;
  /**
   * Used to determine how to decode the request body.
   */
  bodyType: "json" | "url-search-params" | undefined;
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

export interface BaseDataSourceConfig extends Omit<DataSourceConfig, "logger"> {
  pluginSymbol: symbol;
  token?: string | undefined;
  redisUrl: string;
  logger: Logger;
}

export abstract class BaseDataSource extends RESTDataSource {
  readonly serviceName: string;
  readonly token: string | undefined;
  override readonly logger: Logger;

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
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
          jitter: 0.5,
        },
        removeOnComplete: {
          age: 60 * 60,
          count: 1000,
        },
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 5000,
        },
      },
    });

    this.#queueEvents = new QueueEvents(this.#queueId, {
      connection: {
        url: redisUrl,
      },
    });

    this.#worker = new Worker(
      this.#queueId,
      async (job) => {
        this.#decodeRequestBody(job);

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
    this.logger = apolloDataSourceOptions.logger;
  }

  #decodeRequestBody(job: Job<FetchJobInput, FetchResponse>) {
    const { bodyType } = job.data;

    if (!bodyType || !job.data.incomingRequest?.body) {
      return;
    }

    if (typeof job.data.incomingRequest.body !== "string") {
      throw new Error("Unable to decode non-string request body.");
    }

    if (bodyType === "url-search-params") {
      job.data.incomingRequest.body = urlSearchParamsCodec.decode(
        job.data.incomingRequest.body,
      );

      return;
    }

    job.data.incomingRequest.body = jsonCodec(
      z.record(z.string(), z.unknown()),
    ).decode(job.data.incomingRequest.body);
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

  // Generate an outgoing request, after applying any request modifications.
  // This is mostly copied from RESTDataSource, as there was no native way to determine
  // whether a request is cached without actually performing subsequent fetch.
  async #createAugmentedRequest(
    path: string,
    incomingRequest?: DataSourceRequest,
  ): Promise<AugmentedRequest> {
    const augmentedRequest: AugmentedRequest = {
      ...incomingRequest,
      params:
        incomingRequest?.params instanceof URLSearchParams
          ? incomingRequest.params
          : this.#urlSearchParamsFromRecord(incomingRequest?.params),
      headers: incomingRequest?.headers ?? {},
    };

    await this.willSendRequest?.(path, augmentedRequest);

    const downcasedHeaders: Record<string, string> = {};

    // map incoming headers to lower-case headers
    for (const [key, value] of Object.entries(augmentedRequest.headers)) {
      downcasedHeaders[key.toLowerCase()] = value;
    }

    augmentedRequest.headers = downcasedHeaders;

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

    return augmentedRequest;
  }

  #determineRequestBodyType(body: unknown) {
    if (!body) {
      return;
    }

    if (body instanceof URLSearchParams) {
      return "url-search-params";
    }

    if (typeof body === "object") {
      return "json";
    }

    if (typeof body === "string") {
      try {
        JSON.parse(body);
      } catch {
        throw new Error(
          "Unable to determine the request body type: invalid JSON string.",
        );
      }

      return "json";
    }

    throw new Error("Unable to determine the request body type.");
  }

  override async fetch<TResult>(
    path: string,
    incomingRequest?: DataSourceRequest,
  ): Promise<DataSourceFetchResult<TResult>> {
    const augmentedRequest = await this.#createAugmentedRequest(
      path,
      incomingRequest,
    );

    const url = await this.resolveURL(path, augmentedRequest);

    const cacheKey = this.cacheKeyFor(url, augmentedRequest as never);

    const isCached = Boolean(
      await this.#keyv.get(`${this.#keyvPrefix}${cacheKey}`),
    );

    if (isCached) {
      // If we have a cached response, bypass the message queue and fetch directly
      return await super.fetch(path, augmentedRequest);
    }

    // Redis keys use colons as a separator, so they need to be stripped out before insertion
    // const sanitisedJobId = cacheKey.replaceAll(":", "[COLON]");

    const bodyType = this.#determineRequestBodyType(augmentedRequest.body);

    if (bodyType === "url-search-params") {
      augmentedRequest.body = urlSearchParamsCodec.encode(
        augmentedRequest.body as URLSearchParams,
      );
    }

    const job = await this.#queue.add(
      cacheKey,
      {
        path,
        incomingRequest: augmentedRequest,
        bodyType,
      },
      // { jobId: sanitisedJobId },
    );

    const result = await job.waitUntilFinished(this.#queueEvents, 60000);

    this.logger.http(
      `[${this.serviceName}] HTTP ${result.response.status.toString()} response for ${augmentedRequest.method ?? "GET"} ${url}`,
    );

    return {
      parsedBody: result.parsedBody as TResult,
      response: result.response as never,

      // The following fields aren't used by our application,
      // but must be included to satisfy the return type.
      responseFromCache: false,
      requestDeduplication: undefined as never,
      httpCache: {
        cacheWritePromise: Promise.resolve(),
      },
    };
  }

  override async throwIfResponseIsError(options: {
    url: URL;
    request: RequestOptions;
    response: DataSourceFetchResult<unknown>["response"];
    parsedBody: unknown;
  }) {
    if (options.response.ok) {
      return;
    }

    const { response, url } = options;

    if (response.status === 429) {
      const waitMs = this.#parseRetryAfterHeader(
        response.headers.get("Retry-After") ?? "",
      );

      this.logger.warn(
        waitMs
          ? `[${this.serviceName}] Received 429 Too Many Requests response for ${url}; retrying after ${Math.round(waitMs / 1000).toFixed(0)} seconds`
          : `[${this.serviceName}] Received 429 response without valid Retry-After header for ${url}. Using default wait time of 5 seconds.`,
      );

      await this.#queue.rateLimit(waitMs ?? 5000);

      throw Worker.RateLimitError();
    }
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
