import { BaseDataSource } from "@repo/util-plugin-sdk";

import path from "node:path";

import { JellyfinSettings } from "../jellyfin-settings.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";

class JellyfinAPIError extends Error {}

export class JellyfinAPI extends BaseDataSource<JellyfinSettings> {
  override baseURL = this.settings.jellyfinServerUrl;
  override serviceName = "Jellyfin";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): void {
    requestOpts.headers["Authorization"] =
      `MediaBrowser Client=Riven, Token=${this.settings.jellyfinToken}`;
  }

  async updateSections(paths: string[]) {
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

  override async validate() {
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
