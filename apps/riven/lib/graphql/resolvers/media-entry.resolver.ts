import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, ID, Mutation, Resolver } from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { UUID } from "node:crypto";

@Resolver(() => MediaEntry)
export class MediaEntryResolver {
  @Mutation(() => MediaEntry)
  async saveStreamUrl(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: UUID,
    @Arg("url", () => String) url: string,
  ): Promise<MediaEntry> {
    return em.getRepository(MediaEntry).saveStreamUrl(id, url);
  }
}
