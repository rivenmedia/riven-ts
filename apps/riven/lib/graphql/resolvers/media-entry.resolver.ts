import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, Ctx, ID, Mutation, Resolver } from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { UUID } from "node:crypto";

@Resolver((_of) => MediaEntry)
export class MediaEntryResolver {
  @Mutation(() => MediaEntry)
  async saveStreamUrl(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: UUID,
    @Arg("url", () => String) url: string,
  ): Promise<MediaEntry> {
    const entry = await em.findOneOrFail(MediaEntry, id);

    em.assign(entry, {
      streamUrl: url,
    });

    await em.flush();

    return entry;
  }
}
