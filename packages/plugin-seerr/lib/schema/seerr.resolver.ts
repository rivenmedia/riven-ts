import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";
import { PluginDataSource } from "@repo/util-plugin-sdk";
import { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";

import { Arg, Args, Ctx, Mutation, Query, Resolver } from "type-graphql";

import { SeerrAPI } from "../datasource/seerr.datasource.ts";
import { WebhookInput } from "../schemas/webhook-input.schema.ts";
import { pluginConfig } from "../seerr-plugin.config.ts";
import { FilterArguments } from "./arguments/filter.arguments.ts";
import { SeerrHandleWebhookInput } from "./types/seerr-handle-webhook.input.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";

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
    @Ctx() context: { sendEvent: (event: RivenEvent) => void },
  ) {
    const parsedInput = WebhookInput.parse(input.payload);

    if (parsedInput.media.media_type === "movie") {
      context.sendEvent({
        type: "riven.item-requested",
        item: {
          type: "movie",
          externalRequestId: parsedInput.request.request_id,
          imdbId: parsedInput.media.imdbId,
          requestedBy: parsedInput.request.requestedBy_email,
          tmdbId: parsedInput.media.tmdbId,
        },
      });
    } else {
      const requestedSeasons = parsedInput.extra
        .find((extra) => extra.name.toLowerCase() === "requested seasons")
        ?.value.split(",")
        .map((s) => parseInt(s.trim(), 10));

      context.sendEvent({
        type: "riven.item-requested",
        item: {
          type: "show",
          externalRequestId: parsedInput.request.request_id,
          imdbId: parsedInput.media.imdbId,
          requestedBy: parsedInput.request.requestedBy_email,
          tvdbId: parsedInput.media.tvdbId,
          seasons: requestedSeasons,
        },
      });
    }

    return true;
  }
}
