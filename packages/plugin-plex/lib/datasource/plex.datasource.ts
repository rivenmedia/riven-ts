import { BaseDataSource, type BasePluginContext } from "@rivenmedia/plugin-sdk";

import { join } from "node:path";

import { PlexSettings } from "../plex-settings.schema.ts";
import { LibrarySectionsResponse } from "../schemas/library-sections-response.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexAPIError extends Error {}

export class PlexAPI extends BaseDataSource<PlexSettings> {
  override baseURL = this.settings.plexServerUrl;

  override serviceName = "Plex";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  async updateSection(path: string) {
    const response = await this.get<unknown>(`library/sections`);
    const sections = LibrarySectionsResponse.parse(response);

    for (const directory of sections.MediaContainer?.Directory ?? []) {
      for (const location of directory.Location ?? []) {
        const fullPath = join(this.settings.plexLibraryPath, path);

        if (fullPath.startsWith(location.path as string)) {
          if (!directory.key) {
            throw new PlexAPIError(
              `Directory key is missing for path: ${fullPath}`,
            );
          }

          await this.post<unknown>(
            `library/sections/${directory.key}/refresh`,
            { params: { path: fullPath } },
          );

          return;
        }
      }
    }

    throw new PlexAPIError(
      `No matching library section found for path: ${path}`,
    );
  }

  override validate() {
    return true;
  }
}

export type PlexContextSlice = BasePluginContext;
