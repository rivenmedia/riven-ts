import { Field, ID, Int, ObjectType } from "type-graphql";

import { IndexerEnumerableItem } from "./indexer-enumerable-item.type.ts";

@ObjectType({
  implements: IndexerEnumerableItem,
})
export class IndexerEpisode extends IndexerEnumerableItem {
  @Field(() => ID)
  declare public rootId: string;

  @Field(() => Int)
  public seasonNumber!: number;
}
