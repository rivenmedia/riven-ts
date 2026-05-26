import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import { JellyfinSettings } from "../jellyfin-settings.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";

export class JellyfinAPIError extends Error {}

export class JellyfinAPI extends BaseDataSource<JellyfinSettings> {
  override baseURL = this.settings.jellyfinServerUrl;
  override serviceName = "Jellyfin";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): void {
    requestOpts.headers["Authorization"] =
      `MediaBrowser Client=Riven Token=${this.settings.jellyfinToken}`;
  }

  async updateSection(path: string) {
    try {
      await this.post(`Library/Refresh?path=${encodeURIComponent(path)}`);
    } catch (error) {
      throw new JellyfinAPIError(
        `Failed to refresh library section for path: ${path}. Error: ${(error as Error).message}`,
      );
    }
  }

  override async validate() {
    try {
      await this.get("System/Configuration");

      return true;
    } catch {
      return false;
    }
  }
}

export type JellyfinContextSlice = BasePluginContext;
