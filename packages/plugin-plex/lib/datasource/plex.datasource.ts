import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import { join } from "node:path";

import { PlexSettings } from "../plex-settings.schema.ts";

import type {
  LibrarySection,
  LibrarySections,
} from "../__generated__/index.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexAPIError extends Error {}

export class PlexAPI extends BaseDataSource<PlexSettings> {
  get baseURL() {
    return this.settings.plexServerUrl;
  }

  override serviceName = "Plex";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["X-Plex-Token"] = this.settings.plexToken;
    requestOpts.headers["Accept"] = "application/json";
  }

  async updateSection(path: string) {
    const sections = await this.get<
      LibrarySections & { MediaContainer?: { Directory?: LibrarySection[] } }
    >(`library/sections`);

    for (const directory of sections.MediaContainer?.Directory ?? []) {
      for (const location of directory.Location ?? []) {
        const fullPath = join(this.settings.plexLibraryPath, path);

        if (fullPath.startsWith(location.path as string)) {
          if (!directory.key) {
            throw new PlexAPIError(
              `Directory key is missing for path: ${fullPath}`,
            );
          }

          await this.post(
            `library/sections/${directory.key}/refresh?path=${encodeURIComponent(fullPath)}`,
          );

          return true;
        }
      }
    }

    return false;
  }

  override validate() {
    return true;
  }
}

export type PlexContextSlice = BasePluginContext;
