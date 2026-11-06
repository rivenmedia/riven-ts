import { Field, ID, InterfaceType } from "type-graphql";

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
