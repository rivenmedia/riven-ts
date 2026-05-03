import { BaseDataSource, type BasePluginContext } from "@repo/util-plugin-sdk";

import { PlexSettings } from "../plex-settings.schema.ts";
import { MetadataResponse } from "../schemas/metadata-response.schema.ts";

import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ValueOrPromise } from "@apollo/datasource-rest/dist/RESTDataSource.js";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export class PlexMetadataAPIError extends Error {}

export class PlexMetadataAPI extends BaseDataSource<PlexSettings> {
  override baseURL = "https://metadata.provider.plex.tv";

  override serviceName = "Plex Metadata";

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ): ValueOrPromise<void> {
    requestOpts.headers["x-plex-token"] = this.settings.plexToken;
    requestOpts.headers["accept"] = "application/json";
  }

  async convertPlexIdToExternalIds(
    plexId: string,
  ): Promise<ContentServiceRequestedResponse["movies" | "shows"][0]> {
    const res = await this.get<unknown>(`/library/metadata/${plexId}`);
    const data = MetadataResponse.parse(res);

    const guids = data.MediaContainer.Metadata[0]?.Guid;

    if (!guids || guids.length === 0) {
      return {
        externalRequestId: plexId,
      };
    }

    const idMap: Record<string, string> = {};

    guids.forEach((guid) => {
      const [type, externalId] = guid.id.split("://");
      if (type && externalId) {
        idMap[type] = externalId;
      }
    });

    return {
      externalRequestId: plexId,
      tmdbId: idMap["tmdb"],
      tvdbId: idMap["tvdb"],
      imdbId: idMap["imdb"],
    };
  }

  override validate() {
    return true;
  }
}

export type PlexContextSlice = BasePluginContext;
