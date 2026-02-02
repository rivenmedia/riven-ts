import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import z from "zod";

import type {
  LibrarySection,
  LibrarySections,
} from "../__generated__/index.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";

export class PlexAPIError extends Error {}

export class PlexAPI extends BaseDataSource {
  override baseURL = z.url().parse(process.env["PLEX_SERVER_URL"]);
  override serviceName = "Plex";

  #mountDirectory = z.string().parse(process.env["PLEX_MOUNT_DIRECTORY"]);

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    const token = z.string().parse(process.env["PLEX_TOKEN"]);

    requestOpts.headers["X-Plex-Token"] = token;
    requestOpts.headers["Accept"] = "application/json";
  }

  async updateSection(path: string) {
    const sections = await this.get<
      LibrarySections & { MediaContainer?: { Directory?: LibrarySection[] } }
    >(`library/sections`);

    for (const directory of sections.MediaContainer?.Directory ?? []) {
      for (const location of directory.Location ?? []) {
        if (
          `${this.#mountDirectory}/${path}`.startsWith(location.path as string)
        ) {
          if (!directory.key) {
            throw new PlexAPIError(
              `Directory key is missing for path: ${path}`,
            );
          }

          await this.get(
            `library/sections/${directory.key}/refresh?path=${encodeURIComponent(path)}`,
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
