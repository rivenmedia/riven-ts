import { BaseDataSource } from "@repo/util-plugin-sdk";

import { join } from "node:path";

import { LibrarySectionsResponse } from "../schemas/library-sections-response.schema.ts";

import type { PlexSettings } from "../plex-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

class PlexAPIError extends Error {
  public override name = "PlexAPIError";
}

export class PlexAPI extends BaseDataSource<PlexSettings> {
  public override baseURL = this.settings.plexServerUrl;

  public override serviceName = "Plex";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  public async updateSection(path: string) {
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

  public override async validate() {
    try {
      const response = await this.get<unknown>(`library/sections`);

      return LibrarySectionsResponse.safeParse(response).success;
    } catch (error) {
      this.logger.error("Plex validation error", { err: error });

      return false;
    }
  }
}
