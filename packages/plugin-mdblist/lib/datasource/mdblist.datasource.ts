import { BaseDataSource } from "@repo/util-plugin-sdk";

import type {
  GetListItemsByNameQueryResponse,
  GetMyLimitsQueryResponse,
} from "../__generated__/index.ts";
import type { CustomList } from "../schemas/lists.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type {
  RequestOptions,
  ValueOrPromise,
} from "@apollo/datasource-rest/dist/RESTDataSource.ts";

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

  override async validate(): Promise<boolean> {
    try {
      await this.get("user");

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets the user's API limits
   * @returns `GetMyLimitsQueryResponse`
   * @see {@link GetMyLimitsQueryResponse}
   */
  async myLimits(): Promise<GetMyLimitsQueryResponse> {
    return this.get<GetMyLimitsQueryResponse>("user");
  }

  /**
   * Gets list items by list ID
   * @param listId the list ID to get items for
   */
  async getListItemsById(
    listId: number,
  ): Promise<GetListItemsByNameQueryResponse> {
    return this.get<GetListItemsByNameQueryResponse>(
      `lists/${listId.toString()}/items`,
    );
  }

  /**
   * Gets list items by list URL
   * @param listUrl the list URL to get items for
   */
  async getListItemsByUrl(rawUrl: string): Promise<CustomList> {
    const url = new URL(rawUrl);

    if (url.hostname !== "mdblist.com") {
      throw new Error("Invalid MDBList URL");
    }

    if (!url.pathname.endsWith("/json")) {
      url.pathname += "/json";
    }

    return this.get<CustomList>(url.toString());
  }
}
