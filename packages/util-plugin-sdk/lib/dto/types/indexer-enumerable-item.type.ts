import { Min } from "class-validator";
import { Field, ID, Int, InterfaceType } from "type-graphql";

import { IndexerBaseItem } from "./indexer-base-item.type.ts";

@InterfaceType({
  description:
    "An enumerable item returned from an indexer (e.g., a season or episode).",
  implements: IndexerBaseItem,
})
export abstract class IndexerEnumerableItem extends IndexerBaseItem {
  /**
   * The unique identifier for the item's root, e.g. the show ID for a season or episode.
   */
  @Field(() => ID, {
    description:
      "The unique identifier for the item's root, e.g. the show ID for a season or episode.",
  })
  public rootId!: string;

  @Min(0)
  @Field(() => Int)
  public number!: number;
}
