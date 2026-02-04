import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import { TvdbSettings } from "../tvdb-settings.schema.ts";

export class TvdbAPIError extends Error {}

export class TvdbAPI extends BaseDataSource<TvdbSettings> {
  override baseURL = "https://tvdb.com/api/";
  override serviceName = "Tvdb";

  override async validate() {
    try {
      // Implement your own validation logic here
      await this.get("validate");

      return true;
    } catch {
      return false;
    }
  }
}

export type TvdbContextSlice = BasePluginContext;
