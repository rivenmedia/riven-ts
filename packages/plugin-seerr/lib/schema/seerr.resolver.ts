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
  public async seerrIsValid(
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<boolean> {
    return api.validate();
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  public async seerrMovies(
    @Args(() => FilterArguments) { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    const { movies } = await api.getContent(filter);

    return movies;
  }

  @CacheControl({ maxAge: 300 })
  @Query(() => [ExternalIds])
  public async seerrShows(
    @Args(() => FilterArguments) { filter }: FilterArguments,
    @PluginDataSource(pluginConfig.name, SeerrAPI) api: SeerrAPI,
  ): Promise<ExternalIds[]> {
    const { shows } = await api.getContent(filter);

    return shows;
  }

  @Mutation(() => Boolean)
  public seerrHandleWebhook(
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
