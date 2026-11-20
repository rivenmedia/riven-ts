import { BaseDataSource } from "@repo/util-plugin-sdk";

import path from "node:path";

import { ItemsResponse } from "../schemas/items-response.schema.ts";

import type { JellyfinSettings } from "../jellyfin-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";

class JellyfinAPIError extends Error {
  public override name = "JellyfinAPIError";
}

export class JellyfinAPI extends BaseDataSource<JellyfinSettings> {
  public override baseURL = this.settings.jellyfinServerUrl;
  public override serviceName = "Jellyfin";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): void {
    requestOpts.headers["Authorization"] =
      `MediaBrowser Client=Riven, Token=${this.settings.jellyfinToken}`;
  }

  public async updateSections(paths: string[]) {
    try {
      await this.post("Library/Media/Updated", {
        body: JSON.stringify({
          Updates: paths.map((subPath) => ({
            Path: path.join(this.settings.jellyfinLibraryPath, subPath),
            UpdateType: "Created",
          })),
        }),
      });
    } catch (error) {
      throw new JellyfinAPIError(
        `Failed to refresh library section for paths: ${paths.join(", ")}. Error: ${(error as Error).message}`,
      );
    }
  }

  public async getItems() {
    const response = await this.get<unknown>("Items", {
      params: {
        Recursive: "true",
        IncludeItemTypes: "Movie,Series",
        Fields: "Path",
        EnableImages: "false",
        EnableUserData: "false",
      },
    });

    return ItemsResponse.parse(response).Items;
  }

  public async deleteItem(itemId: string) {
    try {
      await this.delete(`Items/${itemId}`);
    } catch (error) {
      throw new JellyfinAPIError(
        `Failed to delete item ${itemId}. Error: ${(error as Error).message}`,
      );
    }
  }

  public override async validate() {
    try {
      await this.get("System/Configuration");

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to connect to Jellyfin server at ${this.settings.jellyfinServerUrl}. Please check your settings. Error: ${(error as Error).message}`,
      );

      return false;
    }
  }
}
