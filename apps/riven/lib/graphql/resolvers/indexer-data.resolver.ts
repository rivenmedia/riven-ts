import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";
import { Ratings } from "@repo/util-plugin-sdk/dto/types/ratings.type";

import { FieldResolver, Resolver } from "type-graphql";

@Resolver(() => IndexerData)
export class IndexerDataResolver {
  @FieldResolver(() => Ratings)
  public ratings() {
    return {};
  }
}
