import type { AugmentedRequest } from "@apollo/datasource-rest";
import type {
  RequestOptions,
  ValueOrPromise,
} from "@apollo/datasource-rest/dist/RESTDataSource.js";
import { BaseDataSource } from "@repo/core-util-datasource";

export class MDBListAPI extends BaseDataSource {
  override baseURL = "https://api.mdblist.com/";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    if (!this.token) {
      throw new Error(
        "MDBList API token is not set. Please provide a valid API token.",
      );
    }

    requestOpts.params.set("apikey", this.token);
  }

  protected override didEncounterError(
    error: Error,
    _request: RequestOptions,
    _url?: URL,
  ): void {
    this.logger.error(`MDBListAPI request error: ${error.message}`);
  }

  async validate(): Promise<boolean> {
    try {
      await this.get("user");

      return true;
    } catch {
      return false;
    }
  }

  //   async myLimits(): Promise<{}> {}

  //   async getListItemsById(listId: string): Promise<[]> {}

  //   async getListItemsByUrl(listUrl: string): Promise<[]> {}
}
