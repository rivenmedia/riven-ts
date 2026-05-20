import { BaseDataSource, type RateLimiterOptions } from "@repo/util-plugin-sdk";
import { FatalValidationError } from "@repo/util-plugin-sdk/errors/fatal-validation-error";
import { json, z } from "@repo/util-plugin-sdk/validation";

import { toMerged } from "es-toolkit";

import {
  type WebhookSettingsSchema,
  webhookSettingsSchema,
} from "../__generated__/zod/webhookSettingsSchema.ts";
import { MetadataSettingsResponse } from "../schemas/metadata-settings-response.schema.ts";
import { RequestResponse } from "../schemas/request-response.schema.ts";
import { UpdateWebhookSettingsResponse } from "../schemas/update-webhook-settings-response.schema.ts";
import { WebhookJsonPayload } from "../schemas/webhook-json-payload.schema.ts";

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
        this.logger.error("Failed to authenticate with Seerr API", {
          err: error,
        });

        throw new SeerrAPIError(
          `Failed to authenticate with Seerr API. Please check the API key is correct and the Seerr instance is reachable. Error: ${(error as Error).message}`,
        );
      }

      await this.#validateOrFixMetadataProviderSettings();
      await this.#validateOrFixWebhookBodySettings();

      return true;
    } catch (error: unknown) {
      if (error instanceof FatalValidationError) {
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
   * Validates the metadata provider settings from the Seerr instance settings.
   *
   * @param metadataSettings Metadata settings from the `/settings/metadatas` response
   */
  #validateMetadataProviderSettingsResponse(
    metadataSettings: MetadataSettingsResponse,
  ) {
    return metadataSettings.tv === "tvdb" && metadataSettings.anime === "tvdb";
  }

  /**
   * Checks the Seerr instance settings to ensure the metadata providers have been set to TVDB.
   *
   * If the `autofixMetadataProviders` plugin setting is enabled, it will attempt to fix the configuration automatically.
   *
   * @throws {SeerrAPIError} If the metadata providers are not set to TVDB.
   */
  async #validateOrFixMetadataProviderSettings() {
    const response = await this.get<unknown>("settings/metadatas");

    const metadataSettings = MetadataSettingsResponse.parse(response);
    const isValid =
      this.#validateMetadataProviderSettingsResponse(metadataSettings);

    if (isValid) {
      return;
    }

    if (this.settings.autofixMetadataProviders) {
      const response = await this.put<unknown>("settings/metadatas", {
        body: JSON.stringify({ tv: "tvdb", anime: "tvdb" }),
      });

      const parsedResponse = MetadataSettingsResponse.parse(response);

      if (parsedResponse.tv !== "tvdb" || parsedResponse.anime !== "tvdb") {
        throw new FatalValidationError(
          `Failed to automatically fix Seerr metadata provider settings. After attempting to update the settings, the response did not reflect the expected metadata provider configuration. Please check the Seerr instance and fix the metadata provider settings manually at ${this.settings.url}/settings/metadata.`,
        );
      }

      this.logger.info(
        "Automatically fixed Seerr metadata provider settings to TVDB",
      );

      return;
    }

    throw new FatalValidationError(
      `Invalid Seerr metadata provider settings. TV provider: ${metadataSettings.tv}, Anime provider: ${metadataSettings.anime}. Ensure both are set to TVDB at ${this.settings.url}/settings/metadata or enable "autofixMetadataProviders" option in the plugin settings to have this automatically fixed by the plugin.`,
    );
  }

  /**
   * Validates the Seerr webhook settings.
   *
   * @param webhookSettings Webhook settings from the `/settings/notifications/webhook` response
   */
  #validateWebhookSettingsResponse(webhookSettings: WebhookSettingsSchema) {
    const REQUIRED_TYPES = 4 | 128; // 132: Request Approved + Request Automatically Approved

    const currentTypes = webhookSettings.types ?? 0;
    const hasRequiredTypes = (currentTypes & REQUIRED_TYPES) === REQUIRED_TYPES;
    const hasExtraTypes = (currentTypes & ~REQUIRED_TYPES) !== 0;
    const validatedWebhookBody = json(WebhookJsonPayload).safeParse(
      webhookSettings.options?.jsonPayload,
    );

    return {
      currentTypes,
      hasExtraTypes,
      isValid:
        hasRequiredTypes && !hasExtraTypes && validatedWebhookBody.success,
      payloadValidationError: validatedWebhookBody.error,
    };
  }

  /**
   * Validates that the Seerr webhook has the required notification types enabled:
   * - Request Approved (bit 4)
   * - Request Automatically Approved (bit 128)
   *
   * These are checked via bitmask (4 | 128 = 132).
   *
   * If the `autofixWebhookBody` plugin setting is enabled, it will attempt to fix the configuration automatically.
   */
  async #validateOrFixWebhookBodySettings() {
    const REQUIRED_TYPES = 4 | 128; // 132: Request Approved + Request Automatically Approved

    const response = await this.get<unknown>("settings/notifications/webhook");

    const webhookSettings = webhookSettingsSchema.parse(response);

    if (!webhookSettings.enabled) {
      return;
    }

    const { currentTypes, hasExtraTypes, isValid, payloadValidationError } =
      this.#validateWebhookSettingsResponse(webhookSettings);

    if (hasExtraTypes && !this.settings.autofixWebhookBody) {
      this.logger.warn(
        "Seerr webhook has additional notification types enabled beyond the required ones. This is fine, but may result in unnecessary webhook calls.",
      );
    }

    if (isValid) {
      return;
    }

    if (this.settings.autofixWebhookBody) {
      const webhookBodyContent = {
        query:
          "mutation ($input: SeerrHandleWebhookInput!) { seerrHandleWebhook(input: $input) }",
        variables: {
          input: {
            payload: {
              notification_type: "{{notification_type}}",
              "{{media}}": {
                imdbId: "{{media_imdbid}}",
                media_type: "{{media_type}}",
                tmdbId: "{{media_tmdbid}}",
                tvdbId: "{{media_tvdbid}}",
              },
              "{{request}}": {
                request_id: "{{request_id}}",
                requestedBy_email: "{{requestedBy_email}}",
              },
              "{{extra}}": [],
            },
          },
        },
      } satisfies WebhookJsonPayload;

      const settingsPayload = {
        types: REQUIRED_TYPES,
        options: {
          jsonPayload: JSON.stringify(
            JSON.stringify(webhookBodyContent, null, 2),
          ),
        },
      } satisfies WebhookSettings;

      const response = await this.post<unknown>(
        "settings/notifications/webhook",
        { body: JSON.stringify(toMerged(webhookSettings, settingsPayload)) },
      );

      const parsedResponse = UpdateWebhookSettingsResponse.parse(response);
      const { isValid: isUpdatedSettingsValid } =
        this.#validateWebhookSettingsResponse(parsedResponse);

      if (!isUpdatedSettingsValid) {
        throw new FatalValidationError(
          `Failed to automatically fix Seerr webhook settings. After attempting to update the settings, the response did not reflect the expected configuration with required notification types and correct JSON payload. Please check the Seerr instance and fix the webhook settings manually at ${this.settings.url}/settings/webhooks.`,
        );
      }

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

    if (payloadValidationError) {
      issues.push(z.prettifyError(payloadValidationError));
    }

    throw new FatalValidationError(
      `Invalid Seerr webhook settings:\n${issues.map((issue) => `- ${issue}`).join("\n")}.\nFix these in the webhook settings at ${this.settings.url}/settings/webhooks or enable the "autofixWebhookBody" option in the plugin settings to have this automatically fixed by the plugin.`,
    );
  }
}
