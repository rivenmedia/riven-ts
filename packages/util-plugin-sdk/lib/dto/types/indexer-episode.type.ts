import { Field, Int, ObjectType } from "type-graphql";

import { IndexerEnumerableItem } from "./indexer-enumerable-item.type.ts";

@ObjectType({
  implements: IndexerEnumerableItem,
})
export class IndexerEpisode extends IndexerEnumerableItem {
  @Field(() => Int)
  public seasonNumber!: number;

  /**
   * The overview or summary of the episode.
   */
  @Field(() => String, {
    description: "The overview or summary of the episode.",
    nullable: true,
  })
  public overview?: string | null;

  /**
   * The date the episode first aired, or null if it hasn't been scheduled.
   */
  @Field(() => Date, {
    description:
      "The date the episode first aired, or null if it hasn't been scheduled.",
    nullable: true,
  })
  public airDate?: Date | null;

  /**
   * The runtime of the episode in minutes.
   */
  @Field(() => Int, {
    description: "The runtime of the episode in minutes.",
    nullable: true,
  })
  public runtime?: number | null;
}
