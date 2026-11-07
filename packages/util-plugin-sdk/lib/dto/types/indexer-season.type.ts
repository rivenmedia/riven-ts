import { Field, ObjectType } from "type-graphql";

import { IndexerEnumerableItem } from "./indexer-enumerable-item.type.ts";
import { IndexerEpisode } from "./indexer-episode.type.ts";

@ObjectType({
  implements: IndexerEnumerableItem,
})
export class IndexerSeason extends IndexerEnumerableItem {
  /**
   * The overview or summary of the season.
   */
  @Field(() => String, {
    description: "The overview or summary of the season.",
    nullable: true,
  })
  public overview?: string | null;

  @Field(() => [IndexerEpisode])
  public episodes!: IndexerEpisode[];
}
