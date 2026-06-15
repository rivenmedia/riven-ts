import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

import { WebhookInput } from "../schemas/webhook-input.schema.ts";
import { SeerrHandleWebhookInput } from "./types/seerr-handle-webhook.input.ts";

import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

@Resolver()
export class SeerrResolver {
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
