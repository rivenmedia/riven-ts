import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@repo/util-plugin-sdk";
import { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

import { Arg, Args, Ctx, Mutation, Query, Resolver } from "type-graphql";

import { SeerrAPI } from "../datasource/seerr.datasource.ts";
import { WebhookInput } from "../schemas/webhook-input.schema.ts";
import { pluginConfig } from "../seerr-plugin.config.ts";
import { FilterArguments } from "./arguments/filter.arguments.ts";
import { SeerrHandleWebhookInput } from "./types/seerr-handle-webhook.input.ts";

import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

@Resolver()
export class SeerrResolver {
  @Query(() => Boolean)
  seerrIsValid(
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<boolean> {
    return api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  async seerrMovies(
    @Args() { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    return (await api.getContent(filter)).movies;
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  async seerrShows(
    @Args() { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    return (await api.getContent(filter)).shows;
  }

  @Mutation(() => Boolean)
  seerrHandleWebhook(
    @Arg("input", () => SeerrHandleWebhookInput) input: SeerrHandleWebhookInput,
    @Ctx() { logger, sendEvent }: GraphQLContext,
  ) {
    const parsedInput = WebhookInput.parse(input.payload);

    if (parsedInput.notification_type === "TEST_NOTIFICATION") {
      logger.info("Seerr webhook notification received");

      return true;
    }

    if (
      parsedInput.notification_type !== "MEDIA_APPROVED" &&
      parsedInput.notification_type !== "MEDIA_AUTO_APPROVED"
    ) {
      logger.warn(
        `Received unsupported Seerr notification type: ${parsedInput.notification_type}`,
      );

      return false;
    }

    const commonFields = {
      externalRequestId: parsedInput.request.request_id,
      requestedBy: parsedInput.request.requestedBy_email,
      imdbId: parsedInput.media.imdbId,
    };

    sendEvent({
      type: "riven-external.item-requested",
      item: {
        ...commonFields,
        ...(parsedInput.media.media_type === "movie"
          ? {
              type: "movie",
              tmdbId: parsedInput.media.tmdbId,
            }
          : {
              type: "show",
              tvdbId: parsedInput.media.tvdbId,
              seasons: parsedInput.requestedSeasons,
            }),
      },
    });

    return true;
  }
}
