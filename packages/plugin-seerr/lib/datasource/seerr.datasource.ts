import { BaseDataSource, type RateLimiterOptions } from "@repo/util-plugin-sdk";
import { NonRetriableValidationError } from "@repo/util-plugin-sdk/errors/non-retriable-validation-error";

import { webhookSettingsSchema } from "../__generated__/zod/webhookSettingsSchema.ts";
import { MetadataSettingsResponse } from "../schemas/metadata-settings-response.schema.ts";
import { RequestResponse } from "../schemas/request-response.schema.ts";
import webhookBodyContent from "./webhook-body.json" with { type: "json" };

import type { GetAuthMeQueryResponse } from "../__generated__/types/GetAuthMe.ts";
import type { WebhookSettings } from "../__generated__/types/WebhookSettings.ts";
import type { ExtendedMediaRequest } from "../schemas/extended-media-request.schema.ts";
import type { SeerrSettings } from "../seerr-settings.schema.ts";
import type { AugmentedRequest } from "@apollo/datasource-rest";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

class SeerrAPIError extends Error {}

export class SeerrAPI extends BaseDataSource<SeerrSettings> {
  override baseURL = new URL("/api/v1/", this.settings.url).toString();
  override serviceName = "Seerr";

  protected override readonly rateLimiterOptions: RateLimiterOptions = {
    max: 20,
    duration: 1000,
  };

  protected override willSendRequest(
    _path: string,
    requestOpts: AugmentedRequest,
  ) {
    requestOpts.headers["x-api-key"] = this.settings.apiKey;
  }

  override async validate() {
    try {
      try {
        await this.get<GetAuthMeQueryResponse>("auth/me");
      } catch (error: unknown) {
        throw new SeerrAPIError(
          "Failed to authenticate with Seerr API. Please check the API key is correct and the Seerr instance is reachable" +
            `. Error: ${(error as Error).message}`,
        );
      }

      await this.#validateMetadataProviderSettings();
      await this.#validateWebhookBodySettings();

      return true;
    } catch (error: unknown) {
      if (error instanceof NonRetriableValidationError) {
        throw error;
      }

      this.logger.error("Seerr validation error", { err: error });

      return false;
    }
  }

  async getContent(
    filter: string,
  ): Promise<Pick<ContentServiceRequestedResponse, "movies" | "shows">> {
    const requests = await this.#getAllRequests(filter);
    const movieMap = new Map<
      number,
      ContentServiceRequestedResponse["movies"][number]
    >();
    const showMap = new Map<
      number,
      ContentServiceRequestedResponse["shows"][number]
    >();

    for (const request of requests) {
      if (request.type === "movie") {
        if (!request.media?.tmdbId) {
          continue;
        }

        movieMap.set(request.media.tmdbId, {
          tmdbId: request.media.tmdbId.toString(),
          externalRequestId: request.id.toString(),
          requestedBy: request.requestedBy?.email,
        });
      }

      if (request.type === "tv") {
        if (!request.media?.tvdbId) {
          continue;
        }

        /**
         * Seerr creates multiple requests within the same show,
         * e.g. one request for seasons 1-3, then another request for season 4.
         *
         * To handle this, we combine seasons from multiple requests for the same show into a single entry in the response.
         */
        const combinedSeasons = new Set([
          ...(showMap.get(request.media.tvdbId)?.seasons ?? []),
          ...request.seasons.map(({ seasonNumber }) => seasonNumber),
        ]);

        showMap.set(request.media.tvdbId, {
          tmdbId: request.media.tmdbId?.toString(),
          tvdbId: request.media.tvdbId.toString(),
          externalRequestId:
            request.media.id?.toString() ?? request.id.toString(),
          requestedBy: request.requestedBy?.email,
          seasons: [...combinedSeasons],
        });
      }
    }

    return {
      movies: [...movieMap.values()],
      shows: [...showMap.values()],
    };
  }

  async #getAllRequests(filter: string): Promise<ExtendedMediaRequest[]> {
    const allResults: ExtendedMediaRequest[] = [];
    const take = 20;
    let skip = 0;
    let totalResults = 0;

    do {
      const response = await this.get<unknown>("request", {
        params: {
          take: take.toString(),
          skip: skip.toString(),
          filter,
          sort: "added",
        },
        skipCache: true,
      });

      const { results, pageInfo } = RequestResponse.parse(response);

      if (results) {
        allResults.push(...results);
      }

      totalResults = pageInfo?.results ?? 0;
      skip += take;
    } while (skip < totalResults);

    return allResults;
  }

  /**
   * Checks the Seerr instance settings to ensure the metadata providers have been set to TVDB.
   *
   * @throws {SeerrAPIError} If the metadata providers are not set to TVDB.
   */
  async #validateMetadataProviderSettings() {
    const response = await this.get<unknown>("settings/metadatas", {
      skipCache: true,
    });

    const metadataSettings = MetadataSettingsResponse.parse(response);

    if (metadataSettings.tv !== "tvdb" || metadataSettings.anime !== "tvdb") {
      if (this.settings.autofixMetadataProvider) {
        await this.put<MetadataSettingsResponse>("settings/metadatas", {
          body: JSON.stringify({ tv: "tvdb", anime: "tvdb" }),
        });

        this.logger.info(
          "Automatically fixed Seerr metadata provider settings to TVDB",
        );

        return;
      }

      throw new NonRetriableValidationError(
        `Invalid Seerr metadata provider settings. TV provider: ${metadataSettings.tv}, Anime provider: ${metadataSettings.anime}. Ensure both are set to TVDB at ${this.settings.url}/settings/metadata or enable the "Automatically fix metadata provider settings" option in the plugin settings to have this automatically fixed by the plugin.`,
      );
    }
  }

  /**
   * Validates that the Seerr webhook has the required notification types enabled:
   * - Request Approved (bit 4)
   * - Request Automatically Approved (bit 128)
   *
   * These are checked via bitmask (4 | 128 = 132).
   */
  async #validateWebhookBodySettings() {
    const REQUIRED_TYPES = 4 | 128; // 132: Request Approved + Request Automatically Approved

    const response = await this.get<unknown>("settings/notifications/webhook", {
      skipCache: true,
    });

    const webhookSettings = webhookSettingsSchema.parse(response);

    if (!webhookSettings.enabled) {
      return;
    }

    const currentTypes = webhookSettings.types ?? 0;
    const hasRequiredTypes = (currentTypes & REQUIRED_TYPES) === REQUIRED_TYPES;
    const hasExtraTypes = (currentTypes & ~REQUIRED_TYPES) !== 0;
    const hasValidPayload =
      webhookSettings.options?.jsonPayload &&
      JSON.stringify(webhookSettings.options.jsonPayload) ===
        JSON.stringify(webhookBodyContent);

    if (hasExtraTypes) {
      this.logger.warn(
        "Seerr webhook has additional notification types enabled beyond the required ones. This is fine but may result in unnecessary webhook calls.",
      );
    }

    if (!hasRequiredTypes || !hasValidPayload) {
      if (this.settings.autofixWebhookBody) {
        const settings: WebhookSettings = {
          types: currentTypes | REQUIRED_TYPES,
          options: {
            jsonPayload: JSON.stringify(webhookBodyContent),
          },
        };
        await this.post("settings/notifications/webhook", {
          body: JSON.stringify(settings),
        });

        this.logger.info(
          "Automatically fixed Seerr webhook settings to include required notification types and payload",
        );

        return;
      }

      const issues: string[] = [];

      if (!(currentTypes & 4)) {
        issues.push('"Request Approved" notification type is not enabled');
      }
      if (!(currentTypes & 128)) {
        issues.push(
          '"Request Automatically Approved" notification type is not enabled',
        );
      }
      if (!hasValidPayload) {
        issues.push("webhook JSON payload does not match the expected body");
      }

      throw new NonRetriableValidationError(
        `Invalid Seerr webhook settings: ${issues.join("; ")}. Fix these in the webhook settings at ${this.settings.url}/settings/webhooks or enable the "Automatically fix webhook body settings" option in the plugin settings to have this automatically fixed by the plugin.`,
      );
    }
  }
}
