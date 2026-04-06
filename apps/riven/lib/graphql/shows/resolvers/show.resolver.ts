import { ItemRequest, Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

import { pubSub } from "../../pub-sub.ts";
import {
  PersistShowIndexerDataInput,
  persistShowIndexerData,
} from "../mutations/persist-show-indexer-data.ts";
import {
  PersistShowItemRequestInput,
  PersistShowItemRequestOutput,
  persistShowItemRequest,
} from "../mutations/persist-show-item-request.ts";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => Show)
export class ShowResolver {
  @Query(() => Show)
  async show(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id") id: number,
  ): Promise<Show> {
    return em.findOneOrFail(Show, id);
  }

  @Subscription(() => ItemRequest, { topics: "SHOW_REQUEST_CREATED" })
  newShowRequested(@Root() payload: ItemRequest): ItemRequest {
    return payload;
  }

  @Mutation(() => PersistShowItemRequestOutput)
  async persistShowItemRequest(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistShowItemRequestInput)
    input: PersistShowItemRequestInput,
  ) {
    const itemRequest = await persistShowItemRequest(input, em);

    pubSub.publish("SHOW_REQUEST_CREATED", itemRequest.item);

    return itemRequest;
  }

  @Mutation(() => Show)
  async persistShowIndexData(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistShowIndexerDataInput)
    input: PersistShowIndexerDataInput,
  ): Promise<Show> {
    return persistShowIndexerData(input, em);
  }
}
