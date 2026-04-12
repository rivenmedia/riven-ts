import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, ID, Mutation, Resolver } from "type-graphql";

import { saveStreamUrlMutation } from "./mutations/save-stream-url.mutation.ts";
import { SaveStreamUrlMutationResponse } from "./types/save-stream-url-mutation-response.type.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { UUID } from "node:crypto";

@Resolver((_of) => MediaEntry)
export class MediaEntryResolver {
  @Mutation(() => SaveStreamUrlMutationResponse)
  async saveStreamUrl(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: UUID,
    @Arg("url", () => String) url: string,
  ): Promise<SaveStreamUrlMutationResponse> {
    const updatedItem = await saveStreamUrlMutation(em, id, url);

    return {
      statusText: "OK",
      success: true,
      message: "Stream URL saved successfully",
      item: updatedItem,
    };
  }
}
