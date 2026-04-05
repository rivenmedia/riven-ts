import { Show } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";

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

  @Mutation(() => PersistShowItemRequestOutput)
  async persistShowItemRequest(
    @Ctx() { em }: ApolloServerContext,
    @Arg("input", () => PersistShowItemRequestInput)
    input: PersistShowItemRequestInput,
  ) {
    return persistShowItemRequest(input, em);
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
