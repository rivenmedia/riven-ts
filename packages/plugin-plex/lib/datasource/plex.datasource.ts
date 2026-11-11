import { BaseDataSource } from "@repo/util-plugin-sdk";

import path from "node:path";

import { LibraryMetadataResponse } from "../schemas/library-metadata-response.schema.ts";
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

  readonly #titleSearchContainerSize = 50;

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  public async getLibrarySectionKey(sectionPath: string) {
    const response = await this.get<unknown>(`library/sections`);
    const sections = LibrarySectionsResponse.parse(response);
    const fullPath = path.join(this.settings.plexLibraryPath, sectionPath);

    for (const directory of sections.MediaContainer?.Directory ?? []) {
      for (const location of directory.Location ?? []) {
        if (fullPath.startsWith(location.path as string)) {
          if (!directory.key) {
            throw new PlexAPIError(
              `Directory key is missing for path: ${fullPath}`,
            );
          }

          return directory.key;
        }
      }
    }

    throw new PlexAPIError(
      `No matching library section found for path: ${sectionPath}`,
    );
  }

  public async updateSection(sectionPath: string) {
    const sectionKey = await this.getLibrarySectionKey(sectionPath);

    await this.post<unknown>(`library/sections/${sectionKey}/refresh`, {
      params: {
        path: path.join(this.settings.plexLibraryPath, sectionPath),
      },
    });
  }

  public async getItemKeysByTitle(sectionKey: string, title: string) {
    const response = await this.get<unknown>(
      `library/sections/${sectionKey}/all`,
      {
        headers: {
          "X-Plex-Container-Size": this.#titleSearchContainerSize.toString(),
          "X-Plex-Container-Start": "0",
        },
        params: { title },
      },
    );

    const { MediaContainer } = LibraryMetadataResponse.parse(response);

    return (MediaContainer.Metadata ?? []).map(({ ratingKey }) => ratingKey);
  }

  /**
   * @returns The folders (shows) and files (movies) the item is stored in
   */
  public async getItemLocations(ratingKey: string) {
    const response = await this.get<unknown>(`library/metadata/${ratingKey}`);
    const {
      MediaContainer: { Metadata: items = [] },
    } = LibraryMetadataResponse.parse(response);

    const folders = items.flatMap(({ Location = [] }) =>
      Location.map(({ path: folder }) => folder),
    );

    const files = items.flatMap(({ Media = [] }) =>
      Media.flatMap(({ Part = [] }) => Part.map(({ file }) => file)),
    );

    return [...folders, ...files];
  }

  public async deleteItem(ratingKey: string) {
    try {
      await this.delete(`library/metadata/${ratingKey}`);
    } catch (error) {
      throw new PlexAPIError(
        `Failed to delete item ${ratingKey}. Make sure "Allow media deletion" is enabled in the Plex server settings. Error: ${(error as Error).message}`,
      );
    }
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
