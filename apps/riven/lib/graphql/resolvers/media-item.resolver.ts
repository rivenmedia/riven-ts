import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";
import type { UUID } from "node:crypto";

@ObjectType()
@Resolver((_of) => MediaItem)
export class MediaItemResolver {
  @Query(() => MediaItemUnion, {
    description:
      "Fetches a media item by its ID. The returned type will be one of the specific media item types (e.g., Movie, Episode) based on the underlying data.",
  })
  mediaItemById(
    @Ctx() { em }: ApolloServerContext,
    @Arg("id", () => ID) id: UUID,
  ) {
    return em.findOneOrFail(MediaItem, id);
  }

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

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
