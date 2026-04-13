import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { Arg, Ctx, Mutation, Resolver } from "type-graphql";

import { MovieRequestInput } from "./inputs/movie-request.input.ts";
import { ShowRequestInput } from "./inputs/show-request.input.ts";
import { requestMovieMutation } from "./mutations/request-movie.mutation.ts";
import { requestShowMutation } from "./mutations/request-show.mutation.ts";
import { RequestItemMutationResponse } from "./types/request-item-mutation-response.type.js";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver()
export class ItemRequestResolver {
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
      };
    } catch (error) {
      if (error instanceof ItemRequestCreateErrorConflict) {
        return {
          success: false,
          message: "A request for this movie already exists.",
          statusText: "conflict",
          item: null,
        };
      }

      if (error instanceof ItemRequestCreateError) {
        return {
          success: false,
          message: error.message,
          statusText: "bad_request",
          item: null,
        };
      }

      throw error;
    }
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
        };
      }

      return {
        statusText: "ok",
        success: true,
        message: "Show request updated successfully.",
        item: itemRequest.item,
      };
    } catch (error) {
      if (error instanceof ItemRequestCreateErrorConflict) {
        return {
          success: false,
          message: "A request for this show already exists.",
          statusText: "conflict",
          item: null,
        };
      }

      if (error instanceof ItemRequestCreateError) {
        return {
          success: false,
          message: error.message,
          statusText: "bad_request",
          item: null,
        };
      }

      throw error;
    }
  }
}
