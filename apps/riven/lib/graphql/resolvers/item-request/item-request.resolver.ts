import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { Arg, Ctx, Mutation, Resolver, Root, Subscription } from "type-graphql";

import { MovieRequestInput } from "./inputs/movie-request.input.ts";
import { ShowRequestInput } from "./inputs/show-request.input.ts";
import { requestMovieMutation } from "./mutations/request-movie.mutation.ts";
import { requestShowMutation } from "./mutations/request-show.mutation.ts";
import { RequestItemMutationResponse } from "./types/request-item-mutation-response.type.js";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver()
export class ItemRequestResolver {
  //#region Movie Requests

  @Subscription(() => ItemRequest, {
    topics: "ITEM_REQUEST_CREATED",
    filter: ({ payload }) =>
      payload instanceof ItemRequest && payload.type === "movie",
  })
  movieRequested(@Root() payload: ItemRequest): ItemRequest {
    return payload;
  }

  @Mutation(() => RequestItemMutationResponse)
  async requestMovie(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => MovieRequestInput) input: MovieRequestInput,
  ): Promise<RequestItemMutationResponse> {
    try {
      const itemRequest = await requestMovieMutation(em, input);

      return {
        statusText: "created",
        success: true,
        message: "Movie request created successfully.",
        item: itemRequest.item,
        errorCode: null,
      };
    } catch (error) {
      if (error instanceof ItemRequestCreateErrorConflict) {
        return {
          success: false,
          message: "A request for this movie already exists.",
          statusText: "conflict",
          item: null,
          errorCode: "conflict",
        };
      }

      if (error instanceof ItemRequestCreateError) {
        return {
          success: false,
          message: error.message,
          statusText: "bad_request",
          item: null,
          errorCode: "unexpected_error",
        };
      }

      throw error;
    }
  }

  //#endregion

  //#region Show Requests

  @Subscription(() => ItemRequest, {
    topics: "ITEM_REQUEST_CREATED",
    filter: ({ payload }) =>
      payload instanceof ItemRequest && payload.type === "show",
  })
  showRequested(@Root() payload: ItemRequest): ItemRequest {
    return payload;
  }

  @Subscription(() => ItemRequest, {
    topics: "ITEM_REQUEST_UPDATED",
    filter: ({ payload }) =>
      payload instanceof ItemRequest && payload.type === "show",
  })
  showRequestUpdated(@Root() payload: ItemRequest): ItemRequest {
    return payload;
  }

  @Mutation(() => RequestItemMutationResponse)
  async requestShow(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => ShowRequestInput) input: ShowRequestInput,
  ): Promise<RequestItemMutationResponse> {
    try {
      const itemRequest = await requestShowMutation(em, input);

      if (itemRequest.requestType === "create") {
        return {
          statusText: "created",
          success: true,
          message: "Show request created successfully.",
          item: itemRequest.item,
          errorCode: null,
        };
      }

      return {
        statusText: "ok",
        success: true,
        message: "Show request updated successfully.",
        item: itemRequest.item,
        errorCode: null,
      };
    } catch (error) {
      if (error instanceof ItemRequestCreateErrorConflict) {
        return {
          success: false,
          message: "A request for this show already exists.",
          statusText: "conflict",
          item: null,
          errorCode: "conflict",
        };
      }

      if (error instanceof ItemRequestCreateError) {
        return {
          success: false,
          message: error.message,
          statusText: "bad_request",
          item: null,
          errorCode: "unexpected_error",
        };
      }

      throw error;
    }
  }

  //#endregion
}
