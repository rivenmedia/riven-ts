import {
  RESTDataSource,
  type DataSourceConfig,
  type DataSourceFetchResult,
  type DataSourceRequest,
  type RequestOptions,
} from "@apollo/datasource-rest";
import { logger } from "@repo/core-util-logger";

export interface BaseDataSourceConfig extends DataSourceConfig {
  token?: string | undefined;
}

export class BaseDataSource extends RESTDataSource {
  serviceName: string;
  token: string | undefined;

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

    this.logger.debug(
      `[${this.serviceName}] API Response for ${path}: ${JSON.stringify(result, null, 2)}`,
    );

    return result;
  }

  protected override didEncounterError(
    error: Error,
    _request: RequestOptions,
    _url?: URL,
  ): void {
    this.logger.error(`[${this.serviceName}] API Error: ${error.message}`);
  }
}
