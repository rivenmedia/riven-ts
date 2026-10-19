import { Field, ID, ObjectType } from "type-graphql";

import { IndexerEnumerableItem } from "./indexer-enumerable-item.type.ts";
import { IndexerEpisode } from "./indexer-episode.type.ts";

@ObjectType({
  implements: IndexerEnumerableItem,
})
export class IndexerSeason extends IndexerEnumerableItem {
  @Field(() => ID)
  public showId!: string;

  @Field(() => [IndexerEpisode])
  public episodes!: IndexerEpisode[];
}
