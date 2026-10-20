import { Field, ID, InterfaceType } from "type-graphql";

import { MediaItemType } from "../enums/media-item-type.enum.ts";

@InterfaceType({
  description: "Base media item fields returned from an indexer.",
})
export abstract class IndexerBaseItem {
  /**
   * The unique identifier for the media item on the indexer.
   */
  @Field(() => ID, {
    description: "The unique identifier for the media item on the indexer.",
  })
  public id!: string;

  /**
   * The unique identifier for the media item's root, e.g. the show ID for an episode.
   */
  @Field(() => ID, {
    description:
      "The unique identifier for the media item's root, e.g. the show ID for an episode. May be null if the media item is already a root item.",
    nullable: true,
  })
  public rootId?: string;

  /**
   * The type of the media item (e.g., movie, show).
   */
  @Field(() => MediaItemType.enum, {
    description: "The type of the media item (e.g., movie, show).",
  })
  public type!: MediaItemType;

  /**
   * The title of the media item.
   */
  @Field(() => String, {
    description: "The title of the media item.",
  })
  public title!: string;

  /**
   * The URL of the poster image for the media item.
   */
  @Field(() => String, {
    description: "The URL of the poster image for the media item.",
    nullable: true,
  })
  public posterUrl?: string | null;
}
