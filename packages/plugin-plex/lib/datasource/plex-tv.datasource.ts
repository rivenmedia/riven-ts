import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import { userPlexAccountSchema } from "../__generated__/index.ts";
import { PlexSettings } from "../plex-settings.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexTvAPIError extends Error {}

export class PlexTvAPI extends BaseDataSource<PlexSettings> {
  override baseURL = "https://plex.tv/api/v2/";

  override serviceName = "Plex TV";

  userUuid?: string;

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  getUserUuid(): string | undefined {
    return this.userUuid;
  }

  override async validate() {
    try {
      const res = await this.get<unknown>(`user`);

      const data = userPlexAccountSchema.parse(res);

      this.userUuid = data.uuid;

      return true;
    } catch (err: unknown) {
      this.logger.error("PlexTvAPI validation error", { err });
      return false;
    }
  }
}

export type PlexContextSlice = BasePluginContext;
