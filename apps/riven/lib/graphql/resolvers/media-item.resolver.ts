import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  Query,
  Resolver,
} from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => MediaItem)
export class MediaItemResolver {
  @Query(() => [MediaItem])
  mediaItems(@Ctx() { em }: ApolloServerContext): Promise<MediaItem[]> {
    return em.find(
      MediaItem,
      {},
      {
        limit: 25,
        overfetch: true,
      },
    );
  }

  @Query(() => MediaItemUnion)
  mediaItem(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: string,
  ) {
    return em.findOneOrFail(MediaItem, id);
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
