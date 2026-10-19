import { Min } from "class-validator";
import { Field, Int, InterfaceType } from "type-graphql";

import { IndexerBaseItem } from "./indexer-base-item.type.ts";

@InterfaceType({
  description:
    "An enumerable item returned from an indexer (e.g., a season or episode).",
})
export abstract class IndexerEnumerableItem extends IndexerBaseItem {
  @Min(0)
  @Field(() => Int)
  public number!: number;
}
