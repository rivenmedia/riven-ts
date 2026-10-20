import { Field, Int, ObjectType } from "type-graphql";

import { IndexerEnumerableItem } from "./indexer-enumerable-item.type.ts";

@ObjectType({
  implements: IndexerEnumerableItem,
})
export class IndexerEpisode extends IndexerEnumerableItem {
  @Field(() => Int)
  public seasonNumber!: number;
}
