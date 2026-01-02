import { logger } from "@repo/core-util-logger";

import {
  type DataSourceConfig,
  type DataSourceFetchResult,
  type DataSourceRequest,
  RESTDataSource,
  type RequestOptions,
} from "@apollo/datasource-rest";
import type { RateLimiterOpts } from "limiter";
import type { Promisable } from "type-fest";

export interface BaseDataSourceConfig extends DataSourceConfig {
  token?: string | undefined;
}

export abstract class BaseDataSource extends RESTDataSource {
  readonly serviceName: string;
  readonly token: string | undefined;

  static readonly rateLimiterOptions: RateLimiterOpts | undefined;

  constructor(options: BaseDataSourceConfig) {
    super(options);

    this.token = options.token;
    this.logger = logger;
    this.serviceName = this.constructor.name;
  }

  override async fetch<TResult>(
    path: string,
    incomingRequest?: DataSourceRequest,
  ): Promise<DataSourceFetchResult<TResult>> {
    const result = await super.fetch<TResult>(path, incomingRequest);

    if (result.response.status === 429) {
      const hasRetryAfter = result.response.headers.has("Retry-After");

      if (!hasRetryAfter) {
        // TODO: Get from global rate limiter
        result.response.headers.set("Retry-After", "1");
      }
    }

    // this.logger.debug(
    //   `[${this.serviceName}] HTTP ${result.response.status.toString()} response for ${path}: ${JSON.stringify(result, null, 2)}`,
    // );

    return result;
  }

  protected override didEncounterError(
    error: Error,
    _request: RequestOptions,
    _url?: URL,
  ): void {
    this.logger.error(`[${this.serviceName}] API Error: ${error.message}`);
  }

  abstract validate(): Promisable<boolean>;

  static getApiToken(): string | undefined {
    return undefined;
  }
}
