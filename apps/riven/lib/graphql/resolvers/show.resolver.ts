import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Resolver, Root } from "type-graphql";

@Resolver((_of) => Show)
export class ShowResolver {
  @FieldResolver(() => [Season])
  seasons(@Root() show: Show) {
    return show.seasons.loadItems();
  }
}
